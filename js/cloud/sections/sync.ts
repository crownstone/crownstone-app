import { CLOUD } from '../cloudAPI'
import { LOG } from '../../logging/Log'
import { Util } from '../../util/Util'
import { Platform } from 'react-native'
import { syncUsersInLocation } from './syncUsersInSphere'
import { NotificationHandler } from "../../backgroundProcesses/NotificationHandler";
import {APP_NAME, HISTORY_PERSISTENCE} from "../../ExternalConfig";
import { AppUtil } from "../../util/AppUtil";
import {getStonesAndAppliancesInSphere} from "../../util/DataUtil";

/**
 * We claim the cloud is leading for the availability of items.
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  __currentlySyncing: false,

  sync: function (store, background = true) {
    if (this.__currentlySyncing) {
      LOG.info("SYNC: Skip Syncing, sync already in progress.");
      return new Promise((resolve, reject) => { resolve() });
    }

    this.__currentlySyncing = true;

    let state = store.getState();
    let actions = [];
    let options = { background: background };

    if (!state.user.userId) {
      // do not sync if we're not logged in
      return;
    }

    LOG.cloud("SYNC: Start Syncing.");

    // set the authentication tokens
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;
    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);
    let cloudData;
    let changedLocations;

    return syncDown( userId, options )
      .catch((err) => {
        // perhaps there is a 401, user token expired or replaced. Retry logging in.
        if (err.status === 401) {
          LOG.warn("Could not verify user, attempting to login again and retry sync.");
          return CLOUD.login({
            email: state.user.email,
            password: state.user.passwordHash,
            background: true,
          })
            .then((response) => {
              CLOUD.setAccess(response.id);
              CLOUD.setUserId(response.userId);
              store.dispatch({type:'USER_APPEND', data: {accessToken: response.id}});
              return syncDown(userId, options);
            })
            .catch((err) => {
              LOG.info("SYNC: COULD NOT VERIFY USER -- ERROR", err);
              if (err.status === 401) {
                AppUtil.logOut(store, {title: "Access token expired.", body:"I could not renew this automatically. The app will clean up and exit now. Please log in again."});
              }
            })
        }
        else {
          throw err;
        }
      })
      .then((data: any) => {
        syncUser(store, actions, data.user);
        cloudData = syncSpheres(store, actions, data.spheres, data.spheresData);
        changedLocations = syncCleanupLocal(store, actions, cloudData);
        syncKeys(actions, data.keys);
        return syncDevices(store, actions, data.devices)
      })
      .then(() => {
        return syncPowerUsage(state, actions);
      })
      .then(() => {
        return cleanupPowerUsage(state, actions);
      })
      .then(() => {
        LOG.info("SYNC: Finished. Dispatching ", actions.length, " actions!");
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        if (actions.length > 0) {
          store.batchDispatch(actions);
        }

        this.events.emit("CloudSyncComplete");

        if (cloudData.addedSphere === true || changedLocations === true) {
          this.events.emit("CloudSyncComplete_spheresChanged");
        }

      })
      .then(() => {
        this.__currentlySyncing = false;
      })
      .catch((err) => {
        this.__currentlySyncing = false;
        LOG.error("SYNC: error during sync:", err);
        throw err;
      })
  }
};

const cleanupPowerUsage = function(state, actions) {
  LOG.info("SYNC: cleanupPowerUsage starting");
  let deleteHistoryThreshold = new Date().valueOf() - HISTORY_PERSISTENCE;

  let sphereIds = Object.keys(state.spheres);
  // check if we have to delete old data:
  for (let i = 0; i < sphereIds.length; i++) {

    // for all spheres
    let sphere = state.spheres[sphereIds[i]];
    let stoneIds = Object.keys(sphere.stones);
    for (let j = 0; j < stoneIds.length; j++) {

      // for all stones in this sphere
      let stone = sphere.stones[stoneIds[j]];
      let dateIds = Object.keys(stone.powerUsage);

      // for all days of power usage we keep:
      for (let k = 0; k < dateIds.length; k++) {
        // check if we have to delete this block if it is too old.
        if (new Date(dateIds[k]).valueOf() < deleteHistoryThreshold) {
          actions.push({
            type: 'REMOVE_POWER_USAGE_DATE',
            sphereId: sphereIds[i],
            stoneId: stoneIds[j],
            dateId: dateIds[k]
          });
        }
      }
    }
  }
};

const syncPowerUsage = function(state, actions) {
  LOG.info("SYNC: syncPowerUsage starting");

  // if we do not upload the data, skip. Even if we have High Frequency Data enabled, this method act as a fallback uploader.
  if (state.user.uploadPowerUsage !== true) {
    return;
  }

  let sphereIds = Object.keys(state.spheres);
  let uploadBatches = [];

  // this is split to reduce the load in the cloud. For the current implementation without cassandra, 100 is max. A request takes about 2 seconds.
  let maxBatchSize = 100;

  // check if we have to upload local data:
  for (let i = 0; i < sphereIds.length; i++) {

    // for all spheres
    let sphere = state.spheres[sphereIds[i]];
    let stoneIds = Object.keys(sphere.stones);
    for (let j = 0; j < stoneIds.length; j++) {

      // for all stones in this sphere
      let stone = sphere.stones[stoneIds[j]];
      let dateIds = Object.keys(stone.powerUsage);

      // for all days of power usage we keep:
      for (let k = 0; k < dateIds.length; k++) {
        let powerUsageBlock = stone.powerUsage[dateIds[k]];

        // check if we have to upload this block
        if (powerUsageBlock.cloud.synced === false) {
          let indices = [];
          let uploadData = [];
          let data = powerUsageBlock.data;
          for (let x = 0; x < data.length; x++) {
            // if synced is null, it will not be synced.
            if (data[x].synced === false) {
              uploadData.push({ power: data[x].power, timestamp: data[x].timestamp, applianceId: data[x].applianceId});
              indices.push(x);

              if (uploadData.length >= maxBatchSize) {
                uploadBatches.push({
                  data: uploadData,
                  indices: indices,
                  sphereId: sphereIds[i],
                  stoneId: stoneIds[j],
                  dateId: dateIds[k]
                });

                uploadData = [];
                indices = [];
              }
            }
          }

          if (uploadData.length > 0) {
            uploadBatches.push({
              data: uploadData,
              indices: indices,
              sphereId: sphereIds[i],
              stoneId: stoneIds[j],
              dateId: dateIds[k]
            });
          }
        }
      }
    }
  }

  let uploadCounter = 0;
  return Util.promiseBatchPerformer(uploadBatches, (uploadBatch) => {
    let stoneId = uploadBatch.stoneId;
    let sphereId = uploadBatch.sphereId;
    let dateId = uploadBatch.dateId;
    uploadCounter++;
    let t1 = new Date().valueOf();
    LOG.info("SYNC: Uploading batch: ", uploadCounter, ' from ', uploadBatches.length,' which has ', uploadBatch.data.length, ' data points');
    return CLOUD.forStone(stoneId).updateBatchPowerUsage(uploadBatch.data, true)
      .then(() => {
        LOG.info("SYNC: Finished batch in", new Date().valueOf() - t1, 'ms');
        actions.push({
          type: "SET_BATCH_SYNC_POWER_USAGE",
          sphereId: sphereId,
          stoneId: stoneId,
          dateId: dateId,
          data: { indices: uploadBatch.indices }
        });
      })
      .catch((err) => {
        LOG.error("SYNC: Could not upload samples",uploadBatch.indices, "due to:", err);
      })
  }).catch((err) => {
    LOG.error("SYNC: Error during sample upload", err);
  });
};


const syncDown = function (userId, options) {
  return new Promise((resolve, reject) => {
    let cloudSpheres = [];
    let cloudSpheresData = {};
    let cloudKeys = [];
    let cloudDevices = [];
    let cloudUser = {};

    let syncPromises = [];

    syncPromises.push(
      CLOUD.getUserData(options)
        .then((data) => {
          cloudUser = data;
        })
    );

    syncPromises.push(
      CLOUD.getKeys(options)
        .then((data) => {
          cloudKeys = data;
        })
    );
    syncPromises.push(
      CLOUD.forUser(userId).getDevices(options)
        .then((data) => {
          cloudDevices = data;
        })
    );
    syncPromises.push(
      CLOUD.getSpheres(options)
        .then((sphereData) => {
          let sphereDataPromises = [];
          sphereData.forEach((sphere) => {
            cloudSpheres.push(sphere);

            // download all data from the cloud to the phone
            sphereDataPromises.push(CLOUD.forSphere(sphere.id).getSphereData(userId, options)
              .then((result) => {
                cloudSpheresData[sphere.id] = result;
              })
            );
          });
          return Promise.all(sphereDataPromises);
        })
    );

    Promise.all(syncPromises)
      .then(() => {
        resolve({keys: cloudKeys, spheres: cloudSpheres, spheresData: cloudSpheresData, devices: cloudDevices, user: cloudUser})
      })
      .catch((err) => {
        reject(err);
      })
  });
};


const syncUser = function(store, actions, userData) {
  let state = store.getState();

  let cloudFirmwareVersions = userData.firmwareVersionsAvailable || null;
  let cloudBootloaderVersions = userData.bootloaderVersionsAvailable || null;

  if (
      state.user && cloudFirmwareVersions && cloudBootloaderVersions &&
      (
        state.user.firmwareVersionsAvailable !== cloudFirmwareVersions ||
        state.user.bootloaderVersionsAvailable !== cloudBootloaderVersions
      )
    ) {
    actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {firmwareVersionsAvailable: cloudFirmwareVersions, bootloaderVersionsAvailable: cloudBootloaderVersions}})
  }

  if (getTimeDifference(userData, state.user) > 0) {
    actions.push({
      type: 'USER_UPDATE',
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      }
    });
  }


};

const getTimeDifference = function(localVersion, cloudVersion) {
  return new Date(localVersion.updatedAt).valueOf() - new Date(cloudVersion.updatedAt).valueOf();
};


const syncCleanupLocal = function(store, actions, cloudData) {
  const state = store.getState();
  let sphereIds = Object.keys(state.spheres);
  let changedLocations = false;

  sphereIds.forEach((sphereId) => {
    if (cloudData.cloudSphereIds[sphereId] === undefined) {
      // we are going to remove this sphere, if it is active we first deactivate it.
      if (state.app.activeSphere == sphereId) {
        store.dispatch({type: 'CLEAR_ACTIVE_SPHERE'});
      }
      actions.push({type: 'REMOVE_SPHERE', sphereId: sphereId});
      changedLocations = true;
    }
    else {
      // if the sphere also exists in the cloud, check if its member need deletion
      let sphere = state.spheres[sphereId];
      let locationIds = Object.keys(sphere.locations);
      let stoneIds = Object.keys(sphere.stones);
      let applianceIds = Object.keys(sphere.appliances);
      let sphereUserIds = Object.keys(sphere.users);

      // cleanup locations
      locationIds.forEach((locationId) => {
        if (cloudData.cloudLocationIds[locationId] === undefined) {
          actions.push({type: 'REMOVE_LOCATION', sphereId: sphereId, locationId: locationId});
          changedLocations = true;
        }
      });

      // cleanup stones
      stoneIds.forEach((stoneId) => {
        if (cloudData.cloudStoneIds[stoneId] === undefined) {
          actions.push({type: 'REMOVE_STONE', sphereId: sphereId, stoneId: stoneId});
        }
      });

      // cleanup appliances
      applianceIds.forEach((applianceId) => {
        if (cloudData.cloudApplianceIds[applianceId] === undefined) {
          actions.push({type: 'REMOVE_APPLIANCE', sphereId: sphereId, applianceId: applianceId});
        }
      });

      // cleanup sphere users
      sphereUserIds.forEach((userId) => {
        if (cloudData.cloudSphereUserIds[sphereId][userId] === undefined) {
          actions.push({type: 'REMOVE_SPHERE_USER', sphereId: sphereId, userId: userId});
        }
      });

    }
  });

  return changedLocations;
};


const syncSpheres = function(store, actions, spheres, spheresData) {
  let cloudSphereUserIds = {};
  let cloudSphereIds = {};
  let cloudStoneIds = {};
  let cloudLocationIds = {};
  let cloudApplianceIds = {};
  let addedSphere = false;

  LOG.cloud("SyncSpheres", spheresData);

  // get the state here so we did not have to wait with an old state on the down sync.
  const state = store.getState();
  spheres.forEach((sphere) => {
    // put id in map so we can easily find it again
    cloudSphereIds[sphere.id] = true;
    cloudSphereUserIds[sphere.id] = {};

    // local reference to this sphere in our redux database.
    let sphereInState = state.spheres[sphere.id];

    // check if we are an admin in this Sphere.
    let adminInThisSphere = false;

    /**
     * Sync the sphere from the cloud to the database
     */
    if (sphereInState === undefined) {
      addedSphere = true;
      actions.push({
        type:'ADD_SPHERE',
        sphereId: sphere.id,
        data:{
          name: sphere.name,
          iBeaconUUID: sphere.uuid,
          meshAccessAddress: sphere.meshAccessAddress,
          aiName: sphere.aiName,
          aiSex: sphere.aiSex,
          exitDelay: sphere.exitDelay || 600,
          latitude: sphere.gpsLocation && sphere.gpsLocation.lat,
          longitude: sphere.gpsLocation && sphere.gpsLocation.lng
        }
      });
    }
    else if (getTimeDifference(sphereInState.config, sphere) < 0) {
      actions.push({
        type: 'UPDATE_SPHERE_CONFIG',
        sphereId: sphere.id,
        data: {
          name: sphere.name,
          iBeaconUUID: sphere.uuid,
          meshAccessAddress: sphere.meshAccessAddress,
          aiName: sphere.aiName,
          aiSex: sphere.aiSex,
          exitDelay: sphere.exitDelay || 600,
          latitude: sphere.gpsLocation && sphere.gpsLocation.lat,
          longitude: sphere.gpsLocation && sphere.gpsLocation.lng
        }});
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }
    else {
      adminInThisSphere = sphereInState.users[state.user.userId] ? sphereInState.users[state.user.userId].accessLevel === 'admin' : false;
    }

    /**
     * Sync the Admins, members and guests from the cloud to the database.
     */
    // sync admins
    Object.keys(spheresData[sphere.id].admins).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].admins[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'admin');
    });
    // sync members
    Object.keys(spheresData[sphere.id].members).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].members[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'member');
    });
    // sync guests
    Object.keys(spheresData[sphere.id].guests).forEach((userId) => {
      cloudSphereUserIds[sphere.id][userId] = true;
      let user = spheresData[sphere.id].guests[userId];
      syncSphereUser(actions, sphere, sphereInState, userId, user, state, 'guest');
    });
    // sync pending invites
    spheresData[sphere.id].pendingInvites.forEach((invite) => {
      cloudSphereUserIds[sphere.id][invite.email] = true;
      if (sphereInState !== undefined && sphereInState.users[invite.email] === undefined) {
        actions.push({
          type: 'ADD_SPHERE_USER',
          sphereId: sphere.id,
          userId: invite.email,
          data: {
            email: invite.email,
            invitationPending: true,
            accessLevel: invite.role
          }
        });
      }
    });


    /**
     * Sync the locations from the cloud to the database.
     */
    spheresData[sphere.id].locations.forEach((location_from_cloud) => {
      cloudLocationIds[location_from_cloud.id] = true;
      let locationInState = undefined;
      if (sphereInState !== undefined && sphereInState.locations[location_from_cloud.id] !== undefined) {
        locationInState = sphereInState.locations[location_from_cloud.id];
        if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) < 0) {
          actions.push({
            type: 'UPDATE_LOCATION_CONFIG',
            sphereId: sphere.id,
            locationId: location_from_cloud.id,
            data: {name: location_from_cloud.name, icon: location_from_cloud.icon, updatedAt: location_from_cloud.updatedAt}
          });
        }
        else if (getTimeDifference(sphereInState.locations[location_from_cloud.id].config, location_from_cloud) > 0) {
          // update cloud since our data is newer!
          let data = {
            name: locationInState.config.name,
            icon: locationInState.config.icon,
            id: location_from_cloud.id,
            sphereId: sphere.id,
            updatedAt: locationInState.config.updatedAt,
          };
          LOG.info("SYNC: Updating location", location_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(location_from_cloud.updatedAt).valueOf(), "local:", locationInState.config.updatedAt, 'diff:', locationInState.config.updatedAt - (new Date(location_from_cloud.updatedAt).valueOf()));
          CLOUD.updateLocation(location_from_cloud.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_LOCATION',
          sphereId: sphere.id,
          locationId: location_from_cloud.id,
          data: {name: location_from_cloud.name, icon: location_from_cloud.icon, updatedAt: location_from_cloud.updatedAt}
        });
      }

      // put the present users from the cloud into the location.
      let userActions = syncUsersInLocation(state, location_from_cloud, locationInState, cloudSphereUserIds[sphere.id], sphere.id);
      for (let i = 0; i < userActions.length; i++) {
        actions.push(userActions[i]);
      }

    });

    /**
     * Sync the stones from the cloud to the database.
     */
    spheresData[sphere.id].stones.forEach((stone_from_cloud) => { // underscores so its visually different from stoneInState
      cloudStoneIds[stone_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"

      // determine the linked location id
      let locationLinkId = null;
      if (stone_from_cloud.locations.length > 0 && stone_from_cloud.locations[0]) {
        locationLinkId = stone_from_cloud.locations[0].id;
      }
      else {
        locationLinkId = null;
      }
      if (sphereInState !== undefined && sphereInState.stones[stone_from_cloud.id] !== undefined) {
        if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) < 0) {
          actions.push({
            type:    'UPDATE_STONE_CONFIG',
            sphereId: sphere.id,
            stoneId:  stone_from_cloud.id,
            data: {
              applianceId:     stone_from_cloud.applianceId,
              crownstoneId:    stone_from_cloud.uid,
              icon:            stone_from_cloud.icon,
              dimmingEnabled:  stone_from_cloud.dimmingEnabled,
              firmwareVersion: stone_from_cloud.firmwareVersion,
              bootloaderVersion: stone_from_cloud.bootloaderVersion,
              hardwareVersion: stone_from_cloud.hardwareVersion,
              iBeaconMajor:    stone_from_cloud.major,
              iBeaconMinor:    stone_from_cloud.minor,
              locationId:      locationLinkId,
              meshNetworkId:   stone_from_cloud.meshNetworkId,
              macAddress:      stone_from_cloud.address,
              name:            stone_from_cloud.name,
              onlyOnWhenDark:  stone_from_cloud.onlyOnWhenDark,
              touchToToggle:   stone_from_cloud.touchToToggle,
              type:            stone_from_cloud.type,
              updatedAt:       stone_from_cloud.updatedAt,
            }
          });
        }
        else if (getTimeDifference(sphereInState.stones[stone_from_cloud.id].config, stone_from_cloud) > 0) {
          // update cloud since our data is newer!
          let stoneInState = sphereInState.stones[stone_from_cloud.id];
          let data = {
            applianceId:       stoneInState.config.applianceId,
            address:           stoneInState.config.macAddress,
            icon:              stoneInState.config.icon,
            id:                stone_from_cloud.id,
            dimmingEnabled:    stoneInState.config.dimmingEnabled,
            firmwareVersion:   stoneInState.config.firmwareVersion,
            bootloaderVersion: stoneInState.config.bootloaderVersion,
            hardwareVersion:   stoneInState.config.hardwareVersion,
            meshNetworkId:     stoneInState.config.meshNetworkId,
            major:             stoneInState.config.iBeaconMajor,
            minor:             stoneInState.config.iBeaconMinor,
            name:              stoneInState.config.name,
            onlyOnWhenDark:    stoneInState.config.onlyOnWhenDark,
            sphereId:          sphere.id,
            touchToToggle:     stoneInState.config.touchToToggle,
            type:              stoneInState.config.type,
            uid:               stoneInState.config.crownstoneId,
            updatedAt:         stoneInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data["json"] = JSON.stringify(stoneInState.behaviour);
          }
          LOG.info("SYNC: Updating Stone", stone_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(stone_from_cloud.updatedAt).valueOf(), "local:", stoneInState.config.updatedAt, 'diff:', stoneInState.config.updatedAt - (new Date(stone_from_cloud.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateStone(stone_from_cloud.id, data).catch(() => {});

          // check if we have to sync the locations:
          if (stoneInState.config.locationId !== locationLinkId) {
            // if the one in the cloud is null, we only create a link
            if (locationLinkId === null && stoneInState.config.locationId !== null) {
              CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id, stoneInState.config.updatedAt, true).catch(() => {});
            }
            else {
              CLOUD.forStone(stone_from_cloud.id).deleteStoneLocationLink(locationLinkId,  sphere.id, stoneInState.config.updatedAt, true)
                .then(() => {
                  if (stoneInState.config.locationId !== null) {
                    return CLOUD.forStone(stone_from_cloud.id).updateStoneLocationLink(stoneInState.config.locationId, sphere.id,  stoneInState.config.updatedAt, true);
                  }
                }).catch(() => {})
            }
          }
        }
      }
      else {
        actions.push({
          type: 'ADD_STONE',
          sphereId: sphere.id,
          stoneId: stone_from_cloud.id,
          data: {
            applianceId:     stone_from_cloud.applianceId,
            crownstoneId:    stone_from_cloud.uid,
            icon:            stone_from_cloud.icon,
            dimmingEnabled:  stone_from_cloud.dimmingEnabled || false,
            firmwareVersion: stone_from_cloud.firmwareVersion,
            bootloaderVersion: stone_from_cloud.bootloaderVersion,
            hardwareVersion: stone_from_cloud.hardwareVersion,
            iBeaconMajor:    stone_from_cloud.major,
            iBeaconMinor:    stone_from_cloud.minor,
            locationId:      locationLinkId,
            meshNetworkId:   stone_from_cloud.meshNetworkId,
            macAddress:      stone_from_cloud.address,
            name:            stone_from_cloud.name,
            onlyOnWhenDark:  stone_from_cloud.onlyOnWhenDark,
            touchToToggle:   stone_from_cloud.touchToToggle,
            type:            stone_from_cloud.type,
            updatedAt:       stone_from_cloud.updatedAt,
          }
        });

        // we only download the behaviour the first time we add the stone.
        if (stone_from_cloud.json !== undefined) {
          let behaviour = JSON.parse(stone_from_cloud.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onHomeExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onRoomExit',  sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_STONE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, stoneId: stone_from_cloud.id, data: behaviour.onAway });
        }
      }

      // sync down schedules of this stone
      if (stone_from_cloud.schedules && stone_from_cloud.schedules.length > 0) {
        // find the schedule in our local database that matches the one in the cloud
        let findMatchingSchedule = (scheduleCloudId) => {
          // if the stone does not exist in the state...
          if (sphereInState !== undefined && sphereInState.stones[stone_from_cloud.id] !== undefined) {
            return null;
          }
          else {
            let schedules = sphereInState.stones[stone_from_cloud.id].schedules;
            let scheduleIds = Object.keys(schedules);
            for (let i = 0; i < scheduleIds.length; i++) {
              if (schedules[scheduleIds[i]].cloudId === scheduleCloudId) {
                return {id: scheduleIds[i], data: schedules[scheduleIds[i]]};
              }
            }
            return null;
          }
        };

        stone_from_cloud.schedules.forEach((schedule_in_cloud) => {
          let matchingLocalSchedule = findMatchingSchedule(schedule_in_cloud.id);
          if (matchingLocalSchedule !== null) {
            if (getTimeDifference(matchingLocalSchedule.data, schedule_in_cloud) < 0) {
              // update local
              actions.push({
                type: 'UPDATE_STONE_SCHEDULE',
                sphereId: sphere.id,
                stoneId:  stone_from_cloud.id,
                scheduleId: matchingLocalSchedule.id,
                data: {
                  label:                  schedule_in_cloud.label || '',
                  time:                   schedule_in_cloud.triggerTimeOnCrownstone,
                  scheduleEntryIndex:     schedule_in_cloud,
                  cloudId:                schedule_in_cloud.id,
                  linkedSchedule:         schedule_in_cloud.linkedSchedule || null,
                  switchState:            schedule_in_cloud.switchState,
                  fadeDuration:           schedule_in_cloud.fadeDuration || 0,
                  intervalInMinutes:      schedule_in_cloud.intervalInMinutes || 0,
                  ignoreLocationTriggers: schedule_in_cloud.ignoreLocationTriggers || false,
                  active:                 schedule_in_cloud.active,
                  repeatMode:             schedule_in_cloud.repeatMode || '24h', // 24h / minute / none
                  activeDays: {
                    Mon: schedule_in_cloud.activeDays.Mon,
                    Tue: schedule_in_cloud.activeDays.Tue,
                    Wed: schedule_in_cloud.activeDays.Wed,
                    Thu: schedule_in_cloud.activeDays.Thu,
                    Fri: schedule_in_cloud.activeDays.Fri,
                    Sat: schedule_in_cloud.activeDays.Sat,
                    Sun: schedule_in_cloud.activeDays.Sun,
                  },
                }
              });
            }
            else if (getTimeDifference(matchingLocalSchedule.data, schedule_in_cloud) > 0) {
              // update cloud since local data is newer!
              let scheduleInState = matchingLocalSchedule.data;
              let data = {
                label:                  scheduleInState.label || '',
                time:                   scheduleInState.triggerTimeOnCrownstone,
                scheduleEntryIndex:     scheduleInState,
                id:                     schedule_in_cloud.id,
                linkedSchedule:         scheduleInState.linkedSchedule || null,
                switchState:            scheduleInState.switchState,
                fadeDuration:           scheduleInState.fadeDuration || 0,
                intervalInMinutes:      scheduleInState.intervalInMinutes || 0,
                ignoreLocationTriggers: scheduleInState.ignoreLocationTriggers || false,
                active:                 scheduleInState.active,
                repeatMode:             scheduleInState.repeatMode || '24h', // 24h / minute / none
                activeDays: {
                  Mon: scheduleInState.activeDays.Mon,
                  Tue: scheduleInState.activeDays.Tue,
                  Wed: scheduleInState.activeDays.Wed,
                  Thu: scheduleInState.activeDays.Thu,
                  Fri: scheduleInState.activeDays.Fri,
                  Sat: scheduleInState.activeDays.Sat,
                  Sun: scheduleInState.activeDays.Sun,
                },
                updatedAt: scheduleInState.updatedAt
              };
              CLOUD.forStone(stone_from_cloud.id).updateSchedule(schedule_in_cloud.id, data, true).catch((err) => { LOG.error("Sync: Could not update schedule in cloud.", err); });
            }
          }
          else {
            // add schedule
            actions.push({
              type: 'ADD_STONE_SCHEDULE',
                sphereId: sphere.id,
                stoneId:  stone_from_cloud.id,
                scheduleId: Util.getUUID(),
                data: {
                  label:                  schedule_in_cloud.label || '',
                  time:                   schedule_in_cloud.triggerTimeOnCrownstone,
                  scheduleEntryIndex:     schedule_in_cloud,
                  cloudId:                schedule_in_cloud.id,
                  linkedSchedule:         schedule_in_cloud.linkedSchedule || null,
                  switchState:            schedule_in_cloud.switchState,
                  fadeDuration:           schedule_in_cloud.fadeDuration || 0,
                  intervalInMinutes:      schedule_in_cloud.intervalInMinutes || 0,
                  ignoreLocationTriggers: schedule_in_cloud.ignoreLocationTriggers || false,
                  active:                 schedule_in_cloud.active,
                  repeatMode:             schedule_in_cloud.repeatMode || '24h', // 24h / minute / none
                  activeDays: {
                    Mon: schedule_in_cloud.activeDays.Mon,
                    Tue: schedule_in_cloud.activeDays.Tue,
                    Wed: schedule_in_cloud.activeDays.Wed,
                    Thu: schedule_in_cloud.activeDays.Thu,
                    Fri: schedule_in_cloud.activeDays.Fri,
                    Sat: schedule_in_cloud.activeDays.Sat,
                    Sun: schedule_in_cloud.activeDays.Sun,
                  },
                }
            })
          }
        });
      }
    });


    /**
     * Sync the appliances from the cloud to the database.
     */
    spheresData[sphere.id].appliances.forEach((appliance_from_cloud) => {
      cloudApplianceIds[appliance_from_cloud.id] = true; // mark this ID as "yes it is in the cloud"
      // check if we have to update of add this appliance
      if (sphereInState !== undefined && sphereInState.appliances[appliance_from_cloud.id] !== undefined) {
        if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) < 0) {
          actions.push({
            type: 'UPDATE_APPLIANCE_CONFIG',
            sphereId: sphere.id,
            applianceId: appliance_from_cloud.id,
            data: {
              name: appliance_from_cloud.name,
              icon: appliance_from_cloud.icon,
              dimmable: appliance_from_cloud.dimmable,
              onlyOnWhenDark: appliance_from_cloud.onlyOnWhenDark,
              updatedAt: appliance_from_cloud.updatedAt
            }
          });
        }
        else if (getTimeDifference(sphereInState.appliances[appliance_from_cloud.id].config, appliance_from_cloud) > 0) {
          // update cloud since our data is newer!
          LOG.info("SYNC: Updating appliance", appliance_from_cloud.id, "in Cloud since our data is newer!");
          let applianceInState = sphereInState.appliances[appliance_from_cloud.id];
          let data = {
            id: appliance_from_cloud.id,
            name: applianceInState.config.name,
            icon: applianceInState.config.icon,
            dimmable: appliance_from_cloud.dimmable,
            onlyOnWhenDark: appliance_from_cloud.onlyOnWhenDark,
            sphereId: sphere.id,
            updatedAt: applianceInState.config.updatedAt,
          };

          // only admins get to update the behaviour
          if (adminInThisSphere === true) {
            data["json"] = JSON.stringify(applianceInState.behaviour);
          }

          LOG.info("SYNC: Updating Appliance", appliance_from_cloud.id, " in Cloud since our data is newer! remote: ", new Date(appliance_from_cloud.updatedAt).valueOf(), "local:", applianceInState.config.updatedAt, 'diff:', applianceInState.config.updatedAt - (new Date(appliance_from_cloud.updatedAt).valueOf()));
          CLOUD.forSphere(sphere.id).updateAppliance(appliance_from_cloud.id, data).catch(() => {});
        }
      }
      else {
        actions.push({
          type: 'ADD_APPLIANCE',
          sphereId: sphere.id,
          applianceId: appliance_from_cloud.id,
          data: {
            name: appliance_from_cloud.name,
            icon: appliance_from_cloud.icon,
            dimmable: appliance_from_cloud.dimmable,
            onlyOnWhenDark: appliance_from_cloud.onlyOnWhenDark,
            updatedAt: appliance_from_cloud.updatedAt
          }
        });

        // we only download the behaviour the first time we add the stone.
        if (appliance_from_cloud.json !== undefined) {
          let behaviour = JSON.parse(appliance_from_cloud.json);

          if (behaviour.onHomeEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeEnter });
          if (behaviour.onHomeExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onHomeExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onHomeExit });
          if (behaviour.onRoomEnter)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomEnter', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomEnter });
          if (behaviour.onRoomExit)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onRoomExit', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onRoomExit });
          if (behaviour.onNear)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onNear', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onNear });
          if (behaviour.onAway)
            actions.push({ type: 'UPDATE_APPLIANCE_BEHAVIOUR_FOR_onAway', sphereId: sphere.id, applianceId: appliance_from_cloud.id, data: behaviour.onAway });
        }
      }
    });
  });

  return {
    cloudSphereUserIds,
    cloudSphereIds,
    cloudStoneIds,
    cloudLocationIds,
    cloudApplianceIds,
    addedSphere
  };
};

/**
 * Sync devices
 */
const syncDevices = function(store, actions, cloudDevices) {
  return new Promise((resolve, reject) => {
    const state = store.getState();

    let { name, address, description, os, userAgent, locale, deviceType, model } = Util.data.getDeviceSpecs(state);

    let deviceId = undefined;
    let deviceAddress = address;
    let matchingDevice = undefined;
    for (let i = 0; i < cloudDevices.length; i++) {
      let cloudDevice = cloudDevices[i];
      if (cloudDevice.address === address) {
        deviceId = cloudDevice.id;
        matchingDevice = cloudDevice;
        break;
      }
      else if (cloudDevice.name === name && cloudDevice.description === description) {
        deviceId = cloudDevice.id;
        deviceAddress = cloudDevice.address;
        matchingDevice = cloudDevice;
      }
      else if (cloudDevice.description === description) {
        deviceId = cloudDevice.id;
        deviceAddress = cloudDevice.address;
        matchingDevice = cloudDevice;
      }
    }


    // this method will clean up any devices that are in our local database but not in the cloud. Cloud is leading.
    // It will also resolve the promise so the sync can continue.
    let resolveAndCleanup = () => {
      // cleanup
      let deleteActions = [];
      let cloudDeviceIdList = {};
      for (let i = 0; i < cloudDevices.length; i++) {
        cloudDeviceIdList[cloudDevices[i].id] = true;
      }
      let localDeviceIdList = Object.keys(store.getState().devices);
      for (let i = 0; i < localDeviceIdList.length; i++) {
        if (cloudDeviceIdList[localDeviceIdList[i]] === undefined) {
          deleteActions.push({type: 'REMOVE_DEVICE', deviceId: localDeviceIdList[i]});
        }
      }
      if (deleteActions.length > 0) {
        LOG.cloud("REMOVING ", deleteActions.length, " devices since they are not in the cloud anymore");
        store.batchDispatch(deleteActions);
      }

      resolve();
    };

    if (deviceId === undefined) {
      let newDevice = null;
      LOG.info("Sync: Create new device in cloud", name, address, description);
      let deviceInfo = {
        name:name,
        address:address,
        description: description,
      };
      if (state.user.uploadDeviceDetails) {
        deviceInfo["os"] = os;
        deviceInfo["deviceType"] = deviceType;
        deviceInfo["userAgent"] = userAgent;
        deviceInfo["model"] = model;
        deviceInfo["locale"] = locale;
      }
      CLOUD.createDevice(deviceInfo)
        .then((device) => {
          newDevice = device;
          return CLOUD.forDevice(device.id).createInstallation({
            deviceType: Platform.OS,
          })
        })
        .then((installation) => {
          actions.push({
            type: 'ADD_INSTALLATION',
            installationId: installation.id,
            data: {deviceToken: null}
          });

          actions.push({
            type: 'ADD_DEVICE',
            deviceId: newDevice.id,
            data: {
              name: name,
              address: address,
              description: description,
              os: os,
              model: model,
              deviceType: deviceType,
              userAgent: userAgent,
              locale: locale,
              installationId: installation.id
            }
          });

          // We now push the location of ourselves to the cloud.
          return updateUserLocationInCloud(state, newDevice.id);
        })
        .then(resolveAndCleanup)
        .catch(reject)
    }
    else if (state.devices[deviceId] === undefined) {
      LOG.info("Sync: User device found in cloud, updating local.");
      let installationId = getInstallationIdFromDevice(matchingDevice.installations);

      // add the device from the cloud to the redux database
      actions.push({
        type: 'ADD_DEVICE',
        deviceId: deviceId,
        data: {
          name: name,
          address: deviceAddress,
          description: description,
          os: os,
          model: model,
          deviceType: deviceType,
          userAgent: userAgent,
          locale: locale,
          installationId: installationId,
          tapToToggleCalibration: matchingDevice.tapToToggleCalibration,
          hubFunction: matchingDevice.hubFunction,
        }
      });

      // if we use this device as a hub, make sure we request permission for notifications.
      if (matchingDevice.hubFunction === true && state.user.developer) {
        LOG.info("Sync: Requesting notification permissions during adding of the Device.");
        NotificationHandler.request();
      }

      // update our unique identifier to match the new device.
      store.dispatch({
        type: 'SET_APP_IDENTIFIER',
        data: {appIdentifier: deviceAddress}
      });

      verifyInstallation(state, deviceId, installationId, actions)
        .then(resolveAndCleanup)
        .catch(reject);
    }
    else {
      let installationId = getInstallationIdFromDevice(matchingDevice.installations);

      // if the device is known under a different number in the cloud, we update our local identifier
      if (deviceAddress !== address) {
        store.dispatch({
          type: 'SET_APP_IDENTIFIER',
          data: {appIdentifier: deviceAddress}
        });
      }
      // Old bug caused the local db to have a device address of null. This should fix that.
      if (state.devices[deviceId].address !== deviceAddress) {
        LOG.info("Sync: update address to", deviceAddress);
        actions.push({
          type:"UPDATE_DEVICE_CONFIG",
          deviceId: deviceId,
          data:{
            name: name,
            address: deviceAddress,
            description: description,
            os: os,
            model: model,
            deviceType: deviceType,
            userAgent: userAgent,
            installationId: installationId,
            hubFunction: matchingDevice.hubFunction,
            locale: locale,
          }
        });

        // if we use this device as a hub, make sure we request permission for notifications.
        if (state.devices[deviceId].hubFunction === true || matchingDevice.hubFunction === true && state.user.developer) {
          LOG.info("Sync: Requesting notification permissions during updating of the device.");
          NotificationHandler.request();
        }
      }

      // if the tap to toggle calibration is available and different from what we have stored, update it.
      if (matchingDevice.tapToToggleCalibration && state.devices[deviceId].tapToToggleCalibration === null) {
        store.dispatch({
          type: 'SET_TAP_TO_TOGGLE_CALIBRATION',
          deviceId: deviceId,
          data: {
            tapToToggleCalibration: matchingDevice.tapToToggleCalibration
          }
        })
      }

      LOG.info("Sync: User device found in cloud, updating installation: ", installationId);
      verifyInstallation(state, deviceId, installationId, actions)
        .then(() => {
          LOG.info("Sync: User device found in cloud, updating location.");
          return updateUserLocationInCloud(state, deviceId)
        })
        .then(resolveAndCleanup)
        .catch(reject);
    }
  });
};

const getInstallationIdFromDevice = function(installations) {
  if (installations && Array.isArray(installations) && installations.length > 0) {
    for (let i = 0; i < installations.length; i++) {
      if (installations[i].appName === APP_NAME) {
        return installations[i].id;
      }
    }
  }
  return null;
};


const verifyInstallation = function(state, deviceId, installationId, actions) {
  if (installationId) {
    return CLOUD.getInstallation(installationId)
      .then((installation) => {
        actions.push({
          type: 'ADD_INSTALLATION',
          installationId: installation.id,
          data: {deviceToken: installation.deviceToken}
        });
      })
  }
  else if (deviceId && state && state.devices && state.devices[deviceId] && state.devices[deviceId].installationId === null) {
    return CLOUD.forDevice(deviceId).createInstallation({
      deviceType: Platform.OS,
    })
      .then((installation) => {
        actions.push({
          type: 'ADD_INSTALLATION',
          installationId: installation.id,
          data: {deviceToken: null}
        });
        actions.push({
          type: 'UPDATE_DEVICE_CONFIG',
          deviceId: deviceId,
          data: {installationId: installation.id}
        });
      })
  }
  else {
    return new Promise((resolve, reject) => { resolve(); });
  }
};

const updateUserLocationInCloud = function(state, deviceId) {
  return new Promise((resolve, reject) => {
    if (state.user.uploadLocation === true) {
      if (state.user.userId) {
        let userLocation = findUserLocation(state, state.user.userId);

        CLOUD.forDevice(deviceId).updateDeviceLocation(userLocation.locationId)
          .then(resolve)
          .catch(reject)
      }
      else {
        resolve();
      }
    }
    else {
      resolve();
    }
  });
};

const findUserLocation = function(state, userId) {
  let presentSphereId = null;
  let presentLocationId = null;

  // first we determine in which sphere we are:
  let sphereIds = Object.keys(state.spheres);
  sphereIds.forEach((sphereId) => {
    if (state.spheres[sphereId].config.present === true) {
      presentSphereId = sphereId;
    }
  });

  // if the user is in a sphere, search for his location.
  if (presentSphereId) {
    let locationIds = Object.keys(state.spheres[presentSphereId].locations);
    locationIds.forEach((locationId) => {
      let location = state.spheres[presentSphereId].locations[locationId];
      let userIndex = location.presentUsers.indexOf(userId);
      if (userIndex !== -1) {
        presentLocationId = locationId;
      }
    });
  }

  return { sphereId: presentSphereId, locationId: presentLocationId };
};

const syncSphereUser = function(actions, sphere, sphereInState, userId, user, state, accessLevel) {
  if (sphereInState !== undefined && sphereInState.users[userId] !== undefined) {
    // since we do not get a profile picture via the same way as the rest of the users, we alter the data to contain our own pic.
    let selfId = state.user.userId;
    let forceUpdate = false;

    // check if the content of the current sphere user in the state is different from that in the cloud.
    if (sphereInState.users[userId] !== undefined) {
      let sphereUserInState = sphereInState.users[userId];
      if (
        user.firstName !== sphereUserInState.firstName ||
        user.lastName !== sphereUserInState.lastName ||
        user.email !== sphereUserInState.email
      ) {
        forceUpdate = true;
        LOG.info("Sync: Force updating local sphere user data with remote sphere user.")
      }
    }

    // the local user has a different path to his/her local picture than the other sphere users.
    if (userId == selfId) {
      user.picture = state.user.picture;
    }

    if (getTimeDifference(sphereInState.users[userId], user) > 0 || forceUpdate) {
      actions.push({
        type: 'UPDATE_SPHERE_USER',
        sphereId: sphere.id,
        userId: user.id,
        data: {
          picture: user.picture,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: accessLevel
        }
      });
    }
  }
  else {
    actions.push({
      type: 'ADD_SPHERE_USER',
      sphereId: sphere.id,
      userId: user.id,
      data: {
        picture: user.picture,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: accessLevel
      }
    });
  }
};

const syncKeys = function(actions, keys) {
  keys.forEach((keySet) => {
    actions.push({type:'SET_SPHERE_KEYS', sphereId: keySet.sphereId, data:{
      adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
      memberKey: keySet.keys.member || null,
      guestKey:  keySet.keys.guest  || null
    }})
  })
};

