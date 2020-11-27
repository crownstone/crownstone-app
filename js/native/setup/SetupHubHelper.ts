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
import { KEY_TYPES, STONE_TYPES } from "../../Enums";
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
  setup(sphereId, stoneId: string) : Promise<any> {
    return this._setup(sphereId, stoneId, false);
  }

  setUartKey(sphereId, stoneId: string) : Promise<any> {
    return this._setup(sphereId, stoneId, true);
  }

  _setup(sphereId, stoneId: string, onlySetKey: boolean) : Promise<any> {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    let stone = DataUtil.getStone(sphereId, stoneId);
    if (!stone)               { throw {code: 1, message:"Invalid stone."}; }
    if (!stone.config.handle) { throw {code: 2, message:"No handle."};     }

    let uartKey = null;
    let hubToken = null;
    let hubCloudId = null;
    let hubId = xUtil.getUUID();
    let setupHubPromise = () => {
      return new Promise((resolve, reject) => {resolve();})
        .then(() => {
          // download UART key from this stone in the cloud
          return CLOUD.getKeys(sphereId, stoneId);
        })
        .then((keyData) => {
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

          if (onlySetKey === false) {
            // generate token
            hubToken = xUtil.getHubHexToken()
            // Create hub in cloud
            return CLOUD.forSphere(sphereId).createHub({ token: hubToken, name: stone.config.name })
          }
        })
        .then((hubData) => {
          if (onlySetKey === false) {
            core.store.dispatch({
              type: "ADD_HUB",
              sphereId,
              hubId: hubId,
              data: { cloudId: hubData.id, linkedStoneId: stoneId }
            })
            hubCloudId = hubData.id;
            return BluenetPromiseWrapper.connect(stone.config.handle, sphereId);
          }
        })
        .then(() => {
          if (onlySetKey === false) {
            LOG.info("hubSetupProgress: connected");
            core.eventBus.emit("setupInProgress", { handle: stone.config.handle, progress: 22 / 20 });
            return BluenetPromiseWrapper.transferHubTokenAndCloudId(hubToken, hubCloudId);
          }
        })
        .then((result) => {
          console.log("RESULT", result)
          LOG.info("hubSetupProgress: token and sphereId has been transferrred");
          return BluenetPromiseWrapper.setUartKey(uartKey);
        })
        .then(() => {
          LOG.info("hubSetupProgress: uart key written");
          return BluenetPromiseWrapper.disconnectCommand();
        })
    }

    // we load the setup into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupHubPromise, {from: 'Setup: claiming hub'});
  }

}
