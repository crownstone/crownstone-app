import {core} from "../Core";
import {DataUtil} from "../util/DataUtil";
import {xUtil} from "../util/StandAloneUtil";
import {BCH_ERROR_CODES} from "../Enums";
import {Permissions} from "./PermissionManager";
import {BluenetPromiseWrapper} from "../native/libInterface/BluenetPromise";
import {LOGd, LOGe, LOGi} from "../logging/Log";
import {Scheduler} from "../logic/Scheduler";
import {tell} from "../logic/constellation/Tellers";
import {SyncNext} from "../cloud/sections/newSync/SyncNext";
import {Get} from "../util/GetUtil";
import {ABILITY_PROPERTY_TYPE_ID} from "../database/reducers/stoneSubReducers/abilities";


class StoneDataSyncerClass {
  initialized = false;

  // The difference between the cache and the tracker is that the tracker has masterhashes from the Crownstone, and the
  // cache has hashes from the app.
  masterHashCache = {};
  masterHashTracker = {};

  scheduledRetries = {};
  pendingBehaviourTriggers = {};
  rescheduledBehaviourTriggers = {};

  constructor() {}

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (
          change.changeStoneHandle ||
          change.changeSphereState ||
          change.stoneChangeBehaviours  ||
          change.stoneChangeAbilities
        ) {
          this.masterHashCache = {};
          this.masterHashTracker = {};
          this.update();
        }
      });

      this.update();
    }
  }


  update() {
    LOGd.info("StoneDataSyncer: Update called.")
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);

    for (let i = 0; i < sphereIds.length; i++) {
      let sphereId = sphereIds[i];
      // update the list with this sphere.

      let sphere = state.spheres[sphereId];
      if (sphere.state.present) {
        let stoneIds = Object.keys(sphere.stones);
        for (let j = 0; j < stoneIds.length; j++) {
          let stoneId = stoneIds[j];
          let stone = sphere.stones[stoneId];
          if (!stone.config.handle) { continue; }

          let initialAbilities = sphere.stones[stoneId].abilities;

          // handle abilities
          if (Permissions.inSphere(sphereId).canChangeAbilities) {
            this._syncAbility(sphereId, stoneId, initialAbilities.dimming,     'dimming');
            this._syncAbility(sphereId, stoneId, initialAbilities.switchcraft, 'switchcraft');
            this._syncAbility(sphereId, stoneId, initialAbilities.tapToToggle, 'tapToToggle');
          }

          // handle behaviours
          if (Permissions.inSphere(sphereId).canChangeBehaviours) {
            let stone = Get.stone(sphereId, stoneId);
            if (!stone) { return; }

            let behaviourIds = Object.keys(stone.behaviours);
            let behavioursHaveChanged = false;
            for (let k = 0; k < behaviourIds.length; k++) {
              let behaviourId = behaviourIds[k];
              let behaviour = stone.behaviours[behaviourId];
              if (this._shouldBehaviourBeSynced(behaviour)) {
                behavioursHaveChanged = true;
              }
            }

            if (behavioursHaveChanged) {
              this._setSyncBehaviourTrigger(sphereId, stoneId).catch((err) => {
                LOGe.info("StoneDataSyncer: Failed promise performing setSyncBehaviourTrigger", err?.message)
              })
            }
          }
        }
      }
    }
  }

  async _setSyncBehaviourTrigger(sphereId, stoneId) : Promise<void> {
    let sessionId = xUtil.getShortUUID()
    LOGd.info("StoneDataSyncer: Setting behaviour syncing trigger for ", sphereId, stoneId, sessionId);
    let id = sphereId+stoneId;

    let stone = Get.stone(sphereId, stoneId);
    if (!stone) { return; }

    let behaviourIds = Object.keys(stone.behaviours);
    let behaviourPromises = [];

    for (let k = 0; k < behaviourIds.length; k++) {
      let behaviourId = behaviourIds[k];
      let behaviour = stone.behaviours[behaviourId];
      if (this._shouldBehaviourBeSynced(behaviour)) {
        LOGd.info("StoneDataSyncer: Attempting to sync behaviour", sphereId, stoneId, behaviourId, sessionId);
        behaviourPromises.push(
          this._syncBehaviour(sphereId, stoneId, behaviourId, stone, behaviour, sessionId).catch((err) => {
            if (err?.message === BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
              // we ignore the duplicate error because a newer version of this behaviour is already being synced to this crownstone.
              // this is done by behaviour so that the promise.All does not fail on a duplicate single behaviour.
            }
            else {
              throw err;
            }
          })
        );
      }
    }

    if (behaviourPromises.length === 0) {
      delete this.pendingBehaviourTriggers[id];
      if (this.rescheduledBehaviourTriggers[id]) {
        await this._setSyncBehaviourTrigger(sphereId, stoneId).catch(() => {})
      }
      return;
    }

    LOGd.info("StoneDataSyncer: Executing behaviour syncing trigger for ", sphereId, stoneId, behaviourPromises.length, sessionId);
    try {
      await Promise.all(behaviourPromises)
      LOGi.info("StoneDataSyncer: Syncing behaviour now...", sphereId, stoneId, sessionId);
      await this.checkAndSyncBehaviour(sphereId, stoneId);
      // clear pending
      delete this.pendingBehaviourTriggers[id];
      if (this.rescheduledBehaviourTriggers[id]) {
        await this._setSyncBehaviourTrigger(sphereId, stoneId).catch(() => {})
        return
      }
    }
    catch (err) {
      LOGe.info("StoneDataSyncer: Failed behaviour sync trigger", sphereId, stoneId, err, sessionId);
      if (err?.message === BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
        // we ignore the duplicate error because a newer version of this behaviour is already being synced to this crownstone.
      }
      else {
        /** if the syncing fails, we set another watcher **/
        delete this.pendingBehaviourTriggers[id];
        if (this.rescheduledBehaviourTriggers[id]) {
          await this._setSyncBehaviourTrigger(sphereId, stoneId).catch(() => {})
          return;
        }
        else {
          LOGi.info("StoneDataSyncer: Rescheduling behaviour sync trigger after failure for", sphereId, stoneId);
          this.scheduledRetries[id] = { clearRetry:
            Scheduler.scheduleCallback(() => {
              LOGi.info("StoneDataSyncer: Executing reschedule behaviour sync trigger", sphereId, stoneId);
              this._setSyncBehaviourTrigger(sphereId, stoneId).catch(() => {});
            }, 5000, "Retry behaviour sync for " + sphereId, stoneId)};
        }
      }
    }
  }

  _syncAbility(sphereId, stoneId, initialAbility, abilityType: AbilityType) {
    switch (abilityType) {
      case "dimming":
        this._syncDimmingAbility( sphereId, stoneId, abilityType);
        break;
      case "switchcraft":
        this._syncSwitchcraftAbility( sphereId, stoneId, abilityType);
        break;
      case "tapToToggle":
        this._syncTapToToggle( sphereId, stoneId, abilityType);
        break;
    }
  }

  _shouldBehaviourBeSynced(behaviour) {
    return !behaviour.syncedToCrownstone || behaviour.deleted || behaviour.idOnCrownstone === null || behaviour.idOnCrownstone === undefined;
  }


  _syncDimmingAbility(sphereId : string, stoneId : string, abilityId: string) {
    LOGd.info("StoneDataSyncer: Checking if dimming needs to be synced..", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = Get.stone(sphereId, stoneId);
    if (!stone)   { return; }
    let ability : AbilityData = stone.abilities[abilityId];
    if (!ability) { return; }

    if (ability.syncedToCrownstone === false) {
      LOGd.info("StoneDataSyncer: Setting ability trigger for dimming", sphereId, stoneId);
      tell(stone).allowDimming(ability.enabledTarget)
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for dimming", sphereId, stoneId);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY",         sphereId, stoneId, abilityId, data:{ enabled: ability.enabledTarget}});
          actions.push({type: "MARK_ABILITY_AS_SYNCED", sphereId, stoneId, abilityId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for dimming", err, sphereId, stoneId);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }

    let propertyId = 'softOnSpeed';
    let softOnSpeedProperty = ability.properties[propertyId];
    if (!softOnSpeedProperty) { return; }

    if (softOnSpeedProperty.syncedToCrownstone === false) {
      LOGd.info("StoneDataSyncer: Setting ability trigger for dimming:softOnSpeed", sphereId, stoneId);
      tell(stone).setSoftOnSpeed(Number(softOnSpeedProperty.valueTarget))
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for dimming speed", sphereId, stoneId, ability.properties.softOnSpeed);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_PROPERTY",         sphereId, stoneId, abilityId, propertyId, data: { value: Number(softOnSpeedProperty.valueTarget)}});
          actions.push({type: "MARK_ABILITY_PROPERTY_AS_SYNCED", sphereId, stoneId, abilityId, propertyId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for dimming speed", sphereId, stoneId, err?.message);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }
  }


  _syncSwitchcraftAbility(sphereId : string, stoneId : string, abilityId: string) {
    LOGd.info("StoneDataSyncer: Checking if switchcraft needs to be synced..", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = Get.stone(sphereId, stoneId);
    if (!stone) { return }
    let ability = stone.abilities[abilityId];
    if (!ability) { return; }

    if (ability.syncedToCrownstone === false) {
      LOGd.info("StoneDataSyncer: Setting ability trigger for switchcraft", sphereId, stoneId);
      tell(stone).setSwitchCraft(ability.enabledTarget)
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for switchcraft", sphereId, stoneId);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY",         sphereId, stoneId, abilityId, data:{ enabled: ability.enabledTarget}});
          actions.push({type: "MARK_ABILITY_AS_SYNCED", sphereId, stoneId, abilityId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            /** if the syncing fails, we set another watcher **/
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for switchcraft", sphereId, stoneId, err?.message);
            this.update();
          }
        });
    }

    let propertyId = ABILITY_PROPERTY_TYPE_ID.doubleTapSwitchcraft;
    let doubleTapProperty = ability.properties[propertyId];
    if (!doubleTapProperty) { return; }

    if (doubleTapProperty.syncedToCrownstone === false) {
      let target = typeof doubleTapProperty.valueTarget === 'string' ? (doubleTapProperty.valueTarget === 'true' ? true : false) : Boolean(doubleTapProperty.valueTarget);
      LOGd.info("StoneDataSyncer: Setting ability trigger for switchcraft:doubleTapProperty", sphereId, stoneId);
      tell(stone).setDoubleTapSwitchCraft(target)
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for switchcraft's doubletap feature", sphereId, stoneId, doubleTapProperty);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_PROPERTY",         sphereId, stoneId, abilityId, propertyId, data: { value: target}});
          actions.push({type: "MARK_ABILITY_PROPERTY_AS_SYNCED", sphereId, stoneId, abilityId, propertyId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for switchcraft's doubletap feature", sphereId, stoneId, err?.message);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }

    let secondPropertyId = ABILITY_PROPERTY_TYPE_ID.defaultDimValue;
    let defaultDimValueProperty = ability.properties[secondPropertyId];
    if (!defaultDimValueProperty) { return; }

    if (defaultDimValueProperty.syncedToCrownstone === false) {
      let target = Number(defaultDimValueProperty.valueTarget)
      LOGd.info("StoneDataSyncer: Setting ability trigger for switchcraft:defaultDimValue", sphereId, stoneId);
      tell(stone).setDefaultDimValue(target)
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for switchcraft's doubletap defaultDimValue feature", sphereId, stoneId, doubleTapProperty);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_PROPERTY",         sphereId, stoneId, abilityId, secondPropertyId, data: { value: target}});
          actions.push({type: "MARK_ABILITY_PROPERTY_AS_SYNCED", sphereId, stoneId, abilityId, secondPropertyId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for switchcraft's doubletap defaultDimValue feature", sphereId, stoneId, err?.message);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }
  }


  _syncTapToToggle(sphereId : string, stoneId : string, abilityId: string) {
    LOGd.info("StoneDataSyncer: Checking if tap2toggle needs to be synced..", sphereId, stoneId);
    // we get it again and check synced again to ensure that we are sending the latest data and that we're not doing duplicates.
    let stone = Get.stone(sphereId, stoneId);
    if (!stone) { return }
    let ability : AbilityData = stone.abilities[abilityId];
    if (!ability) { return; }

    if (ability.syncedToCrownstone === false) {
      LOGd.info("StoneDataSyncer: Setting ability trigger for tap2toggle", sphereId, stoneId);
      tell(stone).setTapToToggle(ability.enabledTarget)
        .then(() => {
          LOGi.info("StoneDataSyncer: Successfully synced ability trigger for tap2toggle", sphereId, stoneId);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY",         sphereId, stoneId, abilityId, data:{ enabled: ability.enabledTarget}});
          actions.push({type: "MARK_ABILITY_AS_SYNCED", sphereId, stoneId, abilityId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for tap2toggle", err, sphereId, stoneId);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }

    let propertyId = 'rssiOffset';
    let rssiOffsetProperty = ability.properties[propertyId];
    if (!rssiOffsetProperty) { return; }

    if (rssiOffsetProperty.syncedToCrownstone === false) {
      LOGd.info("StoneDataSyncer: Setting ability trigger for tap2toggle:rssiOffsetProperty", sphereId, stoneId);
      tell(stone).setTapToToggleThresholdOffset(Number(rssiOffsetProperty.valueTarget))
        .then(() => {
          LOGd.info("StoneDataSyncer: Successfully synced ability trigger for tap2toggle offset", sphereId, stoneId, ability.enabledTarget);
          let actions = [];
          actions.push({type: "UPDATE_ABILITY_PROPERTY",         sphereId, stoneId, abilityId, propertyId, data: { value: Number(ability.enabledTarget)}});
          actions.push({type: "MARK_ABILITY_PROPERTY_AS_SYNCED", sphereId, stoneId, abilityId, propertyId});
          core.store.batchDispatch(actions);
        })
        .catch((err) => {
          if (err?.message !== BCH_ERROR_CODES.REMOVED_BECAUSE_IS_DUPLICATE) {
            LOGe.info("StoneDataSyncer: ERROR Failed to sync ability trigger for tap2toggle offset", sphereId, stoneId, err?.message);
            /** if the syncing fails, we set another watcher **/
            this.update();
          }
        });
    }
  }





  async _syncBehaviour(sphereId, stoneId, behaviourId, stone, behaviour : behaviourWrapper, sessionId) : Promise<void> {
    LOGd.info("StoneDataSyncer: Executing trigger for behaviour", sphereId, stoneId, behaviourId, sessionId);
    if (behaviour.deleted) {
      return this._removeBehaviour(sphereId, stoneId, behaviourId, stone, behaviour, sessionId);
    }

    let behaviourCopy = xUtil.deepCopy(behaviour);
    if (typeof behaviour.data === 'string') {
      behaviourCopy.data = JSON.parse(behaviourCopy.data);
    }

    // the behaviour is already on the Crownstone.
    if (behaviourCopy.idOnCrownstone !== null) {
      return this._updateBehaviour(sphereId, stoneId, behaviourId, stone, behaviourCopy, sessionId);
    }
    else {
      return this._addBehaviour(sphereId, stoneId, behaviourId, stone, behaviourCopy, sessionId);
    }
  }


  async _removeBehaviour(sphereId, stoneId, behaviourId, stone, behaviour: behaviourWrapper, sessionId) : Promise<void> {
    LOGi.info("StoneDataSyncer: Syncing deleted behaviour", sphereId, stoneId, behaviourId, sessionId);
    if (behaviour.idOnCrownstone === null) {
      LOGi.info("StoneDataSyncer: Syncing deleted behaviour by deleting it locally.", sphereId, stoneId, behaviourId, sessionId);
      core.store.dispatch({type: "REMOVE_STONE_BEHAVIOUR", sphereId: sphereId, stoneId: stoneId, behaviourId: behaviourId});
      return
    }

    LOGd.info("StoneDataSyncer: Syncing deleted behaviour which is already on Crownstone", sphereId, stoneId, behaviourId);
    try {
      let returnData = await tell(stone).removeBehaviour(behaviour.idOnCrownstone)

      LOGd.info("StoneDataSyncer: Successfully synced deleted behaviour by deleting it from the Crownstone", sphereId, stoneId, behaviourId, sessionId);
      core.store.dispatch({type: "REMOVE_STONE_BEHAVIOUR", sphereId: sphereId, stoneId: stoneId, behaviourId: behaviourId});
      let masterHash = returnData.masterHash || null;
      this.updateMasterHash(sphereId, stoneId, masterHash);
    }
    catch (err) {
      LOGe.info("StoneDataSyncer: ERROR failed synced deleted behaviour by deleting it from the Crownstone", sphereId, stoneId, behaviourId, err?.message, sessionId);
      throw err;
    }
  }


  async _updateBehaviour(sphereId, stoneId, behaviourId, stone, behaviour, sessionId) {
    LOGd.info("StoneDataSyncer: Updating behaviour which is already on Crownstone", sphereId, stoneId, behaviourId, sessionId);
    try {
      let returnData = await tell(stone).updateBehaviour(behaviour);
      LOGi.info("StoneDataSyncer: Successfully updated behaviour which is already on Crownstone", sphereId, stoneId, behaviourId, sessionId);
      core.store.dispatch({type: "UPDATE_STONE_BEHAVIOUR", sphereId: sphereId, stoneId: stoneId, behaviourId: behaviourId, data:{syncedToCrownstone: true}});

      let masterHash = returnData.masterHash || null;
      this.updateMasterHash(sphereId, stoneId, masterHash);
    }
    catch(err) {
      LOGe.info("StoneDataSyncer: ERROR updating behaviour which is already on Crownstone", sphereId, stoneId, behaviourId, err?.message, sessionId);
      throw err;
    }
  }


  async _addBehaviour(sphereId, stoneId, behaviourId, stone, behaviour, sessionId) {
    LOGd.info("StoneDataSyncer: Adding behaviour to Crownstone", sphereId, stoneId, behaviourId, sessionId);
    try {
      let returnData = await tell(stone).addBehaviour(behaviour)
      LOGd.info("StoneDataSyncer: Successfully Adding behaviour to Crownstone", sphereId, stoneId, behaviourId, sessionId);
      let index = returnData.index;
      let masterHash = returnData.masterHash || null;
      this.updateMasterHash(sphereId, stoneId, masterHash);

      // handle duplicates!
      if (stone) {
        let behaviours = stone.behaviours;
        let behaviourIds = Object.keys(behaviours);
        for (let i = 0; i < behaviourIds.length; i++) {
          let behaviour = behaviours[behaviourIds[i]];
          if (behaviour.idOnCrownstone === index && behaviourId !== behaviourIds[i]) {
            // this behaviour is a duplicate &&
            core.store.dispatch({type: "REMOVE_STONE_BEHAVIOUR", sphereId: sphereId, stoneId: stoneId, behaviourId: behaviourId});
            return
          }
        }
      }

      core.store.dispatch({type: "UPDATE_STONE_BEHAVIOUR", sphereId: sphereId, stoneId: stoneId, behaviourId: behaviourId, data:{syncedToCrownstone: true, idOnCrownstone: index}});
    }
    catch(err) {
      LOGi.info("StoneDataSyncer: ERROR Adding behaviour to Crownstone ", sphereId, stoneId, behaviourId, err?.message, sessionId);
      throw err;
    }
  }


  _getTransferBehavioursFromStone(sphereId,stoneId) : {behaviourId: string, behaviour: behaviourTransfer}[] {
    let stone = Get.stone(sphereId,stoneId);

    let behaviourIds = Object.keys(stone.behaviours);
    let transferBehaviours = [];
    for (let i = 0; i < behaviourIds.length; i++) {
      let behaviour = xUtil.deepCopy(stone.behaviours[behaviourIds[i]]);
      if (typeof behaviour.data === 'string') {
        behaviour.data = JSON.parse(behaviour.data);
      }

      delete behaviour.id;
      delete behaviour.cloudId;
      delete behaviour.deleted;
      delete behaviour.syncedToCrownstone;
      delete behaviour.updatedAt;

      transferBehaviours.push({behaviourId: behaviourIds[i], behaviour: behaviour});
    }
    return transferBehaviours;
  }

  async requestMasterHash(sphereId: string, stoneId: string) : Promise<number> {
    let transferBehaviours = this._getTransferBehavioursFromStone(sphereId, stoneId);
    let behaviourData = [];
    transferBehaviours.forEach((data) => {
      behaviourData.push(data.behaviour)
    })
    let masterHash = 0;
    if (transferBehaviours.length > 0) {
      masterHash = await BluenetPromiseWrapper.getBehaviourMasterHash(behaviourData);
    }
    this.updateMasterHashCache(sphereId, stoneId, masterHash);
    return masterHash;
  }

  updateMasterHashCache(sphereId: string, stoneId: string, masterHash: number) {
    if (this.masterHashCache[sphereId] === undefined)          { this.masterHashCache[sphereId] = {}; }
    if (this.masterHashCache[sphereId][stoneId] === undefined) { this.masterHashCache[sphereId][stoneId] = null; }

    this.masterHashCache[sphereId][stoneId] = masterHash;
  }

  getCachedMasterHash(sphereId: string, stoneId: string) : number | null {
    return this.masterHashCache[sphereId]?.[stoneId] ?? null;
  }

  updateMasterHash(sphereId: string, stoneId: string, masterHash: number) {
    if (this.masterHashTracker[sphereId] === undefined)          { this.masterHashTracker[sphereId] = {}; }
    if (this.masterHashTracker[sphereId][stoneId] === undefined) { this.masterHashTracker[sphereId][stoneId] = null; }

    this.masterHashTracker[sphereId][stoneId] = masterHash;

    this.updateMasterHashCache(sphereId, stoneId, masterHash);
  }

  getLastKnownMasterHash(sphereId: string, stoneId: string) : number | null {
    return this.masterHashTracker[sphereId]?.[stoneId] ?? null;
  }


  async checkAndSyncBehaviour(sphereId, stoneId, force = false) : Promise<void> {
    let stone = Get.stone(sphereId,stoneId);
    if (!stone) { throw new Error("STONE_NOT_FOUND"); }

    let transferBehaviours = this._getTransferBehavioursFromStone(sphereId, stoneId);
    let behaviourData = [];
    transferBehaviours.forEach((data) => {
      behaviourData.push(data.behaviour);
    })

    try {
      let masterHash = await BluenetPromiseWrapper.getBehaviourMasterHash(behaviourData)
      let lastKnownMasterHash = this.getLastKnownMasterHash(sphereId, stoneId);
      if (force === false && lastKnownMasterHash === masterHash) {
        LOGi.info("StoneDataSyncer: checkAndSyncBehaviour DONE Syncing! NOT REQUIRED!");
        return;
      }


      // setTime while we're going to be connected anyway.
      tell(stone).setTime().catch((err) => {})

      // SYNC!
      LOGi.info("StoneDataSyncer: Syncing behaviours now... My Master Hash", masterHash, " vs Crownstone hash", lastKnownMasterHash, "my behaviours are", behaviourData);
      let behavioursAccordingToCrownstone = await tell(stone).syncBehaviours(behaviourData);
      LOGi.info("StoneDataSyncer: behavioursAccordingToCrownstone", behavioursAccordingToCrownstone)

      // since there appearently was a change, we first sync with the cloud to ensure that we're really up to date and can do all
      // the behaviour comparing locally.
      // TODO: this will re-add behaviours if they are quickly removed one by one.
      await downloadBehavioursFromCloud(sphereId, stone);

      LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Starting the compare analysis.");

      // get the behaviours from the db again since the cloudsync may have added a few.
      transferBehaviours = this._getTransferBehavioursFromStone(sphereId, stoneId);
      let actions = [];

      LOGd.info("StoneDataSyncer: Transfer behaviours", transferBehaviours);
      if (behavioursAccordingToCrownstone) {
        // From this, we get all behaviours that SHOULD be on our phone.
        // (the ones not synced yet (which should be already synced by here, but still) are also in this list).

        // We first double check the differences between OUR behaviours and those on the Crownstone
        let indicesThatMatched = {};
        behavioursAccordingToCrownstone.forEach((stoneBehaviour: behaviourTransfer) => {
          let foundMatch = false;

          // the sync operation of the lib will allow entries without an id to pass. These need not be checked.
          if (stoneBehaviour.idOnCrownstone === undefined || stoneBehaviour.idOnCrownstone === null) { return; }

          for (let i = 0; i < transferBehaviours.length; i++) {
            // once we have decided on a match, a behaviour cannot be used for matching again.
            if (indicesThatMatched[i]) { continue; }

            LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Comparing", stoneBehaviour, transferBehaviours[i].behaviour);
            if (xUtil.deepCompare(stoneBehaviour, transferBehaviours[i].behaviour)) {
              indicesThatMatched[i] = true;
              foundMatch = true;
              LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Compare is a MATCH.");
              // great! this is already in the list. We do not have to do anything here.
              break
            }
            else {
              LOGd.info("StoneDataSyncer: checkAndSyncBehaviour Compare was not a match.");
            }
          }

          if (!foundMatch) {
            LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Found an unknown behaviour, we will add this.", JSON.stringify(stoneBehaviour), JSON.stringify(transferBehaviours))
            // this is a new behaviour!
            let newBehaviourId = xUtil.getUUID();
            actions.push({
              type: "ADD_STONE_BEHAVIOUR",
              sphereId: sphereId,
              stoneId: stoneId,
              behaviourId: newBehaviourId,
              data: {
                type:           stoneBehaviour.type,
                data:           JSON.stringify(stoneBehaviour.data),
                activeDays:     stoneBehaviour.activeDays,
                profileIndex:   stoneBehaviour.profileIndex,
                idOnCrownstone: stoneBehaviour.idOnCrownstone,
                syncedToCrownstone: true,
              }
            });
          }
        })

        indicesThatMatched = {};
        transferBehaviours.forEach((transferBehaviour: {behaviourId: string, behaviour: behaviourTransfer}) => {
          let foundMatch = false;

          for (let i = 0; i < behavioursAccordingToCrownstone.length; i++) {
            if (indicesThatMatched[i]) { continue; }

            if (xUtil.deepCompare(transferBehaviour.behaviour, behavioursAccordingToCrownstone[i])) {
              indicesThatMatched[i] = true;
              foundMatch = true;
              // great! this is already in the list. We do not have to do anything here.
              break
            }
          }

          if (!foundMatch) {
            LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Behaviour should be deleted");
            actions.push({
              type: "REMOVE_STONE_BEHAVIOUR",
              sphereId: sphereId,
              stoneId: stoneId,
              behaviourId: transferBehaviour.behaviourId,
            });
          }
        });
      }
      else {
        LOGi.info("StoneDataSyncer: checkAndSyncBehaviour All behaviour should be deleted.");
        actions.push({
          type: "REMOVE_ALL_BEHAVIOURS_OF_STONE",
          sphereId: sphereId,
          stoneId: stoneId,
        });
      }

      if (actions.length > 0) {
        LOGi.info("StoneDataSyncer: checkAndSyncBehaviour required sync actions!", actions);
        core.store.batchDispatch(actions);
      }
      else {
        LOGi.info("StoneDataSyncer: checkAndSyncBehaviour Crownstone and app are in sync!");
        this.updateMasterHash(sphereId, stoneId, masterHash);
      }
    }
    catch (err) {
      LOGe.info("StoneDataSyncer: checkAndSyncBehaviour Error Syncing!", err);
      throw err;
    }
  }
}


async function downloadBehavioursFromCloud(sphereId, stone) {
  let stoneId = stone.id;
  if (stone.config.cloudId) {
    try {
      await SyncNext.partialStoneSync(stoneId, "BEHAVIOURS")
    }
    catch (err) {
      LOGe.info("StoneDataSyncer: checkAndSyncBehaviour Error downloading behaviours.", err)
    }
  }
}

export class BehaviourTracker {

  sphereId: string;
  stoneId: string;

  syncing = false;

  constructor(sphereId: string, stoneId: string) {
    this.sphereId = sphereId;
    this.stoneId = stoneId;
  }

  async receivedMasterHash(latestMasterHash) {
    if (this.syncing === true) { return; }
    let lastKnownHash = StoneDataSyncer.getCachedMasterHash(this.sphereId, this.stoneId);
    if (lastKnownHash === null) {
      try {
        lastKnownHash = await StoneDataSyncer.requestMasterHash(this.sphereId, this.stoneId);
      }
      catch(err) {
        LOGe.info("StoneDataSyncer: BehaviourTracker: Could not request masterHash.");
      }
    }
    let comparibleHash = lastKnownHash >>> 16;

    if (comparibleHash !== latestMasterHash) {
      LOGi.info("StoneDataSyncer: BehaviourTracker: Triggering sync since the comparible hash is different from the lastest hash", lastKnownHash, comparibleHash, latestMasterHash);
      this.syncing = true;
      await StoneDataSyncer.checkAndSyncBehaviour(this.sphereId, this.stoneId)
        .catch((err) => {
          LOGe.info("StoneDataSyncer: BehaviourTracker: Failed to sync behaviour based on the master hash from the alternative state.", err);
        })
      this.syncing = false;
    }
  }
}



export const StoneDataSyncer = new StoneDataSyncerClass();