import {Get} from "./GetUtil";
import {StoneAvailabilityTracker} from "../native/advertisements/StoneAvailabilityTracker";
import {Alert, Text, View} from "react-native";
import {Scheduler} from "../logic/Scheduler";
import {LOGe, LOGi, LOGw} from "../logging/Log";
import {DataUtil} from "./DataUtil";
import {core} from "../Core";
import {CLOUD} from "../cloud/cloudAPI";
import * as React from "react";
import {HubHelper} from "../native/setup/HubHelper";
import {HubReplyError} from "../views/hubViews/HubEnums";
import {Languages} from "../Languages";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubUtil", key)(a,b,c,d,e);
}


type HubProblem = null |
  'NO_HUB_IN_DB' |
  'NO_LINKED_STONE' |
  'NO_UART_CONNECTION' |
  'HUB_NOT_INITIALIZED' |
  'MULTIPLE_HUB_INSTANCES_ON_STONE' |
  'HUB_NOT_FROM_THIS_SPHERE' |
  'UART_ENCRYPTION_NOT_ENABLED' |
  'CLOUD_ID_MISSING' |
  'HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT' |
  'HUB_NOT_CONNECTED_TO_THE_INTERNET' |
  'HUB_REPORTS_ERROR'


export const HubUtil = {

  getProblems: function(sphereId, hubId, stoneId) : HubProblem {
    let stone; let hub;

    if (!hubId) {
      stone = Get.stone(sphereId, stoneId);
      if (!stone) { return "NO_LINKED_STONE"; }
      hub = DataUtil.getHubByStoneId(sphereId, stoneId);
    }
    else {
      hub = Get.hub(sphereId, hubId);
    }

    if (!hub) { return "NO_HUB_IN_DB"; }

    stone = Get.stone(sphereId, stoneId ?? hub.config.linkedStoneId);
    if (!stone) { return "NO_LINKED_STONE"; }

    let hubState = hub.state;
    if (StoneAvailabilityTracker.isAvailable(stone.id)) {
      // if encryption is not enforced by both parties and the connection is not alive...
      if (hubState.uartAlive === false) { return "NO_UART_CONNECTION"; }

      // this means the dongle is set up, but the hub itself is not setup.
      if (hubState.hubHasBeenSetup === false) { return "HUB_NOT_INITIALIZED"; }
    }

    const hubs = DataUtil.getAllHubsWithStoneId(sphereId, stone.id);
    if (hubs.length > 1) { return 'MULTIPLE_HUB_INSTANCES_ON_STONE'; }

    if (StoneAvailabilityTracker.isAvailable(stone.id)) {
      if (hubState.uartAliveEncrypted === false && hubState.uartEncryptionRequiredByCrownstone === true && hubState.uartEncryptionRequiredByHub === true) {
        return "HUB_NOT_FROM_THIS_SPHERE";
      }

      if (hubState.uartAlive === true && hubState.uartAliveEncrypted === false && hubState.uartEncryptionRequiredByCrownstone === false && hubState.uartEncryptionRequiredByHub === true) {
        return "UART_ENCRYPTION_NOT_ENABLED";
      }
    }

    if (!hub.config.cloudId) { return "CLOUD_ID_MISSING"; }

    // if the last time we synced is later than what we have stored as last seen on cloud, and it is more than 30 mins ago.
    if (CLOUD.lastSyncTimestamp > hub.config.lastSeenOnCloud && Date.now() - hub.config.lastSeenOnCloud > 1800*1000) {
      return "HUB_NOT_REPORTED_TO_CLOUD_TIMEOUT";
    }


    if (StoneAvailabilityTracker.isAvailable(stone.id)) {
      if (hubState.hubHasInternet === false) { return "HUB_NOT_CONNECTED_TO_THE_INTERNET"; }

      if (hubState.hubHasError) { return "HUB_REPORTS_ERROR"; }
    }

    return null;
  },


  async createHub(sphereId, stoneId, source = "ROOT") {
    let helper = new HubHelper();
    let stone = Get.stone(sphereId, stoneId);
    try {
      LOGi.info("Setting up hub...")
      let hubId;
      try {
        hubId = await helper.setup(sphereId, stoneId);
      }
      catch(err) {
        // if this hub is not in setup mode anymore, attempt to initalize it.
        if (err?.errorType === HubReplyError.NOT_IN_SETUP_MODE) {
          hubId = await helper.setUartKey(sphereId, stoneId);
        }
        else {
          throw err;
        }
      }
      core.store.dispatch({
        type: "UPDATE_HUB_CONFIG",
        sphereId: sphereId,
        hubId: hubId,
        data: { locationId: stone.config.locationId }
      });

      await HubUtil.fixMultipleHubs(sphereId, stoneId, source);
      await Scheduler.delay(3000);
    }
    catch(err) {
      LOGe.info("Problem settings up new hub", err?.message);
      Alert.alert(
        lang("_Something_went_wrong_____header"),
        lang("_Something_went_wrong_____body"),
        [{text:lang("_Something_went_wrong_____left")}]);
    }
  },
  
  
  async fixMultipleHubs(sphereId, stoneId, source = "ROOT", ) {
    const hubs = DataUtil.getAllHubsWithStoneId(sphereId, stoneId);
    let helper = new HubHelper();
    if (hubs.length > 1) {
      let cloudIds = {};
      for (let hub of hubs) {
        cloudIds[hub.config.cloudId] = hub;
      }

      // this means it was synced twice, or otherwise a duplicate instance was added.
      if (Object.keys(cloudIds).length === 1) {
        core.store.dispatch({type:"REMOVE_HUB", sphereId: sphereId, hubId: cloudIds[Object.keys(cloudIds)[0]].id});
        return;
      }

      try {
        let requestCloudId = await helper.getCloudIdFromHub(sphereId, stoneId);
        let foundMatch = false
        for (let item of hubs) {
          if (requestCloudId && item?.config?.cloudId !== requestCloudId || foundMatch) {
            if (item?.config?.cloudId) {
              try { await CLOUD.deleteHub(item.config.cloudId); } catch (e) { }
            }
            core.store.dispatch({type:"REMOVE_HUB", sphereId: sphereId, hubId: item.id});
          }
          else {
            foundMatch = true;
          }
        }
      }
      catch(err) {
        if (source === "ROOT" && err?.type === HubReplyError.IN_SETUP_MODE) {
          await HubUtil.createHub(sphereId, stoneId,'fixMultipleHubs')
          return
        }


        Alert.alert(
          lang("_Something_went_wrong_____Pleas_header"),
          lang("_Something_went_wrong_____Pleas_body"),
          [{text:lang("_Something_went_wrong_____Pleas_left")}]);
      }
    }
  }


}