import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper } from '../libInterface/BluenetPromise';
import { LOG, LOGe, LOGi } from "../../logging/Log";
import { CLOUD }                 from '../../cloud/cloudAPI'
import {Scheduler} from "../../logic/Scheduler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {ScheduleUtil} from "../../util/ScheduleUtil";
import {StoneUtil} from "../../util/StoneUtil";
import { HubReplyCode, KEY_TYPES, STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { xUtil } from "../../util/StandAloneUtil";
import { UpdateCenter } from "../../backgroundProcesses/UpdateCenter";
import { DataUtil } from "../../util/DataUtil";
import { NativeBus } from "../libInterface/NativeBus";


const networkError = 'network_error';

export class SetupHubHelper {
  /**
   * This will setup a hub. It requires the linked stone object to be setupped already.
   * @param sphereId
   * @param name // this name is shared with the stone object that we linked to it.
   * @returns {Promise<T>}
   */
  setup(sphereId, stoneId: string) : Promise<string> {
    return this._setup(sphereId, stoneId, true);
  }

  setUartKey(sphereId, stoneId: string) : Promise<string> {
    return this._setup(sphereId, stoneId, false);
  }

  async _setup(sphereId, stoneId: string, createHubOnline: boolean) : Promise<string> {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone)               { throw {code: 1, message:"Invalid stone."}; }
    if (!stone.config.handle) { throw {code: 2, message:"No handle."};     }

    let uartKey = null;
    let hubToken = null;
    let hubCloudId = null;
    let hubId = xUtil.getUUID();
    core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 22 / 20 });
    let setupHubPromise = async () => {
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 24 / 20 });
      // download UART key from this stone in the cloud
      let keyData = await CLOUD.getKeys(sphereId, stoneId);
      if (keyData.length === 1) {
        let stoneKeys = keyData[0].stoneKeys[stone.config.cloudId] || [];
        for (let i = 0; i < stoneKeys.length; i++) {
          if (stoneKeys[i].keyType === "UART_DEVICE_KEY") {
            uartKey = stoneKeys[i].key;
            break;
          }
        }
      }

      if (!uartKey) { throw {code: 10, message:"No Uart Key available."}; }
      // we now have everything we need to create a hub.
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 26 / 20 });
      if (createHubOnline) {
        // generate token
        hubToken = xUtil.getHubHexToken()
        // Create hub in cloud
        let hubData = await CLOUD.forSphere(sphereId).createHub({ token: hubToken, name: stone.config.name });
        core.store.dispatch({
          type: "ADD_HUB",
          sphereId,
          hubId: hubId,
          data: { cloudId: hubData.id, linkedStoneId: stoneId }
        })
        hubCloudId = hubData.id;
      }
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 28 / 20 });
      await BluenetPromiseWrapper.connect(stone.config.handle, sphereId);

      LOG.info("hubSetupProgress: connected");
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 30 / 20 });
      if (createHubOnline) {
        LOG.info("hubSetupProgress: token and sphereId being prepared...");
        let tokenResult = await BluenetPromiseWrapper.transferHubTokenAndCloudId(hubToken, hubCloudId);
        core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 32 / 20 });
        if (tokenResult.type === 'error') {
          throw {message:"Something went wrong during the transferHubTokenAndCloudId", code: tokenResult.errorType};
        }
        LOG.info("hubSetupProgress: token and sphereId has been transferrred");
      }

      if (!createHubOnline) {
        LOG.info("hubSetupProgress: Requesting cloud Id...");
        let requestedId = await BluenetPromiseWrapper.requestCloudId();
        console.log("requestCloudId Received key data", requestedId)
        hubCloudId = requestedId.message;
      }
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 34 / 20 });

      await BluenetPromiseWrapper.setUartKey(uartKey);
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 36 / 20 });
      await BluenetPromiseWrapper.disconnectCommand();
      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 38 / 20 });

      if (!createHubOnline) {
        let hubId = await this._setLocalHub(sphereId, stoneId, hubCloudId);
      }

      core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 40 / 20 });
      return hubCloudId;
    }

    // we load the setup into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupHubPromise, {from: 'Setup: claiming hub'});
  }


  /**
   * this method will ask the hub for it's cloud id. It will then do the following:
   * _setLocalHub
   * @param sphereId
   * @param stoneId
   */
  async createLocalHubInstance(sphereId, stoneId: string) : Promise<string> {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone)               { throw {code: 1, message:"Invalid stone."}; }
    if (!stone.config.handle) { throw {code: 2, message:"No handle."};     }

    let uartKey = null;
    let hubToken = null;
    let hubCloudId = null;
    let hubId = xUtil.getUUID();
    let setupHubPromise = async () => {
      // we now have everything we need to create a hub.
      await BluenetPromiseWrapper.connect(stone.config.handle, sphereId);

      LOG.info("hubSetupProgress: Requesting cloud Id...");
      let requestedId = await BluenetPromiseWrapper.requestCloudId();
      hubCloudId = requestedId.message;
      await BluenetPromiseWrapper.disconnectCommand();

      let hubId = await this._setLocalHub(sphereId, stoneId, hubCloudId);

      return hubId;
    }

    // we load the setup into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupHubPromise, {from: 'Setup: claiming hub'});
  }


  /**
   * 1 - Check if we have a hub with this ID in our local database.
   * 2 - if 1 fails, Check if we have access to this cloud id in the cloud.
   * 3 - if 1 and 2 fail, Create a entry in our local database to apply the hub data to. else create local entry with the corresponding cloud data.
   * @param sphereId
   * @param stoneId
   * @param hubCloudId
   */
  async _setLocalHub(sphereId, stoneId, hubCloudId) {
    let hubId = xUtil.getUUID();
    LOG.info("Check if the hub is already in our database...");
    let existingHub = DataUtil.getHubByCloudId(sphereId, hubCloudId);
    LOG.info(existingHub);
    let type = "ADD_HUB";
    if (existingHub) {
      type = "UPDATE_HUB_CONFIG";
      hubId = existingHub.id;
    }
    try {
      LOG.info("Check if we have access to that hub in the cloud...");
      let hubData = await CLOUD.getHub(hubCloudId);
      core.store.dispatch({
        type, sphereId, hubId,
        data: { cloudId: hubCloudId, linkedStoneId: stoneId }
      });
    }
    catch (e) {
      LOG.info("Nope. we dont have it.",e);
      core.store.dispatch({
        type, sphereId, hubId,
        data: { cloudId: null, linkedStoneId: stoneId }
      });
    }
    return hubId;
  }


}
