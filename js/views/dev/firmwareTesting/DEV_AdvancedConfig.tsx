//
// import { Languages } from "../../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("DEV_AdvancedConfig", key)(a,b,c,d,e);
// }
import { LiveComponent } from "../../LiveComponent";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Stacks } from "../../../router/Stacks";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { ConnectionManager } from "../../../backgroundProcesses/dev/ConnectionManager";
import { core } from "../../../core";
import Toast from 'react-native-same-toast';
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { background, colors, styles } from "../../styles";
import { Alert, ScrollView, TouchableOpacity, Text, View } from "react-native";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import React from "react";
import { BleStatusBar } from "./DEV_FirmwareTest";
import { SlideInView } from "../../components/animated/SlideInView";
import { ListEditableItems } from "../../components/ListEditableItems";
import { BleUtil } from "../../../util/BleUtil";
import { IconButton } from "../../components/IconButton";
import { DataUtil } from "../../../util/DataUtil";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import { xUtil } from "../../../util/StandAloneUtil";
import { LOGe } from "../../../logging/Log";


const BLE_STATE_READY = "ready";
const BLE_STATE_BUSY = "busy";

const PROXY_OPTIONS = {keepConnectionOpen: true}

export class DEV_AdvancedConfig extends LiveComponent<{
  item: crownstoneAdvertisement,
  handle: string,
  name: string,
  mode:string,
  componentId: string
}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: props.name, leftNav: {id: 'back', text:'Back'}})
  }

  bleStateResetTimeout;

  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      bleState: BLE_STATE_READY,
      mode: props.mode || 'unverified',
      setupActive: false,
      setupProgress: 0,
      debugInformation: null,
    }
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'back') {
      NavigationUtil.setRoot( Stacks.DEV_searchingForCrownstones() )
      FocusManager.stopScanning()
      ConnectionManager.disconnect();
    }
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("FOCUS_RSSI_UPDATE", () => {
      TopBarUtil.updateOptions(this.props.componentId, { title: FocusManager.name + " " + FocusManager.crownstoneState.rssiAverage })
    }));

    this.unsubscribe.push(core.eventBus.on("FOCUS_UPDATE", () => {
      this.forceUpdate();
    }));
  }

  componentWillUnmount(): void {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }


  bleAction(action : (...any) => Promise<any>, props = [], type = null, resultHandler = (any) => {}, failureHandler = () => {}, connect = true) {
    if (this.state.bleState === BLE_STATE_BUSY) {
      Toast.showWithGravity('  Bluetooth Busy!  ', Toast.SHORT, Toast.CENTER);
      return;
    }

    FocusManager.setUpdateFreeze(type);

    let promise = null;
    this.setState({bleState: BLE_STATE_BUSY})
    let state = core.store.getState();

    if (connect) {
      ConnectionManager.connectWillStart(this.props.handle)
      let proxy = BleUtil.getProxy(this.props.handle, FocusManager.crownstoneState.referenceId || state.devApp.sphereUsedForSetup);
      promise = proxy.performPriority(action, props, PROXY_OPTIONS)
    }
    else {
      ConnectionManager.disconnect()
      let actionPromise = () => {
        return action.apply(this, props);
      };
      // @ts-ignore
      promise = BlePromiseManager.registerPriority(actionPromise, { from: 'performing self contained action' })
    }

    // perform.
    promise
      .then((result) => {
        resultHandler(result);
        FocusManager.setFreezeTimeout(type);
        this.setState({bleState: BLE_STATE_READY});
        if (connect) { ConnectionManager.setDisconnectTimeout() }
      })
      .catch((err) => {
        FocusManager.clearUpdateFreeze(type);
        failureHandler()
        this.showBleError(err);
        if (connect) { ConnectionManager.disconnect() }
      })
  }


  showBleError(err) {
    clearTimeout(this.bleStateResetTimeout);
    this.setState({ bleState: err });
    this.bleStateResetTimeout = setTimeout(() => {
      this.setState({ bleState: BLE_STATE_READY });
    }, 6000);
  }

  _getItems(explanationColor) {
    let items = [];
    items.push({label: "CONFIGS", type: 'explanation', color: explanationColor});

    let success = () => { core.eventBus.emit("hideNumericOverlaySuccess"); }
    let failed = () => { core.eventBus.emit("hideNumericOverlayFailed"); }





    if (this.state.mode === 'unverified') {
      items.push({label: "Disabled for unverified Crownstone.", type: 'info'});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({label: "Disabled for Crownstone in DFU mode.", type: 'info'});
    }
    else {
      items.push({
        label: "Switchcraft Threshold",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.switchCraftThreshold || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getSwitchcraftThreshold, [], null, (result) => {
            FocusManager.crownstoneState.switchCraftThreshold = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setSwitchcraftThreshold, [Number(value)], null, success, failed )
        }
      });

      items.push({
        label: "Max Chip Temp",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.maxChipTemp || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getMaxChipTemp, [], null, (result) => {
            FocusManager.crownstoneState.maxChipTemp = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setMaxChipTemp, [Number(value)], null, success, failed)
        }
      });

      items.push({label: "DIMMER", type: 'explanation', color: explanationColor});
      items.push({
        label: "Dimmer Threshold",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerCurrentThreshold || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getDimmerCurrentThreshold, [], null, (result) => {
            FocusManager.crownstoneState.dimmerCurrentThreshold = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setDimmerCurrentThreshold, [Number(value)], null, success, failed)
        }
      });

      items.push({
        label: "Dimmer Temp Up",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempUpThreshold || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getDimmerTempUpThreshold, [], null, (result) => {
            FocusManager.crownstoneState.dimmerTempUpThreshold = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setDimmerTempUpThreshold, [Number(value)], null, success, failed)
        }
      });

      items.push({
        label: "Dimmer Temp Down",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempDownThreshold || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getDimmerTempDownThreshold, [], null, (result) => {
            FocusManager.crownstoneState.dimmerTempDownThreshold = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setDimmerTempDownThreshold, [Number(value)], null, success, failed)
        }
      });

      items.push({label: "POWER MEASUREMENT", type: 'explanation', color: explanationColor});
      items.push({
        label: "Voltage Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.voltageZero || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getVoltageZero, [], null, (result) => {
            FocusManager.crownstoneState.voltageZero = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setVoltageZero, [Number(value)], null, success, failed)
        }
      });
      items.push({
        label: "Current Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.currentZero || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getCurrentZero, [], null, (result) => {
            FocusManager.crownstoneState.currentZero = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setSwitchcraftThreshold, [Number(value)], null, success, failed)
        }
      });
      items.push({
        label: "Power Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.powerZero || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getPowerZero, [], null, (result) => {
            FocusManager.crownstoneState.powerZero = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setPowerZero, [Number(value)], null, success, failed)
        }
      });


      items.push({label: "ADC CONFIG", type: 'explanation', color: explanationColor});
      items.push({
        label: "Voltage Multiplier",
        type: 'numericGetSet',
        digits: 6,
        value: FocusManager.crownstoneState.voltageMultiplier || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getVoltageMultiplier, [], null, (result) => {
            FocusManager.crownstoneState.voltageMultiplier = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setVoltageMultiplier, [Number(value)], null, success, failed)
        }
      });
      items.push({
        label: "Current Multiplier",
        type: 'numericGetSet',
        digits: 6,
        value: FocusManager.crownstoneState.currentMultiplier || null,
        getCallback: () => {
          this.bleAction(BluenetPromiseWrapper.getCurrentMultiplier, [], null, (result) => {
            FocusManager.crownstoneState.currentMultiplier = result.data;
            this.forceUpdate();
          })
        },
        setCallback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setCurrentMultiplier, [Number(value)], null, success, failed)
        }
      });



      items.push({label: "DEV COMMANDS", type: 'explanation', color: explanationColor});
      items.push({
        label: "Disable UART",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.setUartState, [0], null);
        }
      });
      items.push({
        label: "UART RX ONLY",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.setUartState, [1], null);
        }
      });
      items.push({
        label: "UART TX & RX",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.setUartState, [3], null);
        }
      });
    }

    items.push({
      label: "Get Behaviour Debug Information",
      icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueDark.hex }}/>,
      type: 'navigation',
      callback: () => {
        this.setState({debugInformation: null});
        this.bleAction(BluenetPromiseWrapper.getBehaviourDebugInformation, [], null, (response) => {
          let data = response.data;
          const mapBitmaskArray = (arr) => {
            let result = "None";
            for (let i = 0; i < arr.length; i++) {
              if (result === "None" && arr[i]) {
                result = i + '';
              }
              else if (arr[i]) {
                result += ", " + i
              }
            }
            return result;
          }

          data.activeBehaviours = mapBitmaskArray(data.activeBehaviours);
          data.activeEndConditions = mapBitmaskArray(data.activeEndConditions);

          data.behavioursInTimeoutPeriod = mapBitmaskArray(data.behavioursInTimeoutPeriod);

          data.presenceProfile_0 = mapBitmaskArray(data.presenceProfile_0);
          data.presenceProfile_1 = mapBitmaskArray(data.presenceProfile_1);
          data.presenceProfile_2 = mapBitmaskArray(data.presenceProfile_2);
          data.presenceProfile_3 = mapBitmaskArray(data.presenceProfile_3);
          data.presenceProfile_4 = mapBitmaskArray(data.presenceProfile_4);
          data.presenceProfile_5 = mapBitmaskArray(data.presenceProfile_5);
          data.presenceProfile_6 = mapBitmaskArray(data.presenceProfile_6);
          data.presenceProfile_7 = mapBitmaskArray(data.presenceProfile_7);

          data.storedBehaviours = mapBitmaskArray(data.storedBehaviours);

          let string = xUtil.stringify(data, 2);
          console.log("STONE DEBUG INFORMATION:", string);
          this.setState({debugInformation: string});
        })
        BatchCommandHandler.executePriority()
      }
    });

    if (this.state.debugInformation) {
      items.push({
        __item:
          <View style={{
            backgroundColor: colors.white.hex,
            minHeight: 300
          }}>
            <Text style={{
              padding: 15,
              color: colors.black.hex,
              fontSize: 12
            }}>{this.state.debugInformation}</Text>
          </View>
      });
    }

    if (this.state.mode === "verified") {
      let state = core.store.getState();
      let sphere = state.spheres[FocusManager.crownstoneState.referenceId];
      if (sphere) {
        items.push({ label: "In Sphere_" + sphere.config.name, type: 'explanation', below: false, color: explanationColor });
      }
    }



    items.push({type: 'spacer'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }


  render() {
    let backgroundImage = background.light;
    let explanationColor = colors.black.rgba(0.9);

    switch (FocusManager.crownstoneMode ) {
      case "setup":
        explanationColor = colors.white.hex;
        backgroundImage = require('../../../images/backgrounds/blueBackground2.jpg');
        break;
      case "verified":
        backgroundImage = background.light;
        break;
      case "unverified":
        backgroundImage = background.menu;
        break;
      case "dfu":
        backgroundImage = require('../../../images/backgrounds/upgradeBackground.jpg');
        break;
    }

    if (FocusManager.crownstoneState.error) {
      backgroundImage = require('../../../images/backgrounds/somethingWrong.jpg');
      explanationColor = colors.white.rgba(0.5);
    }


    let triggerErrorMessage = () => {
      if (!(this.state.bleState === BLE_STATE_READY || this.state.bleState === BLE_STATE_BUSY)) {
        Alert.alert("BLE Error:", JSON.stringify(this.state.bleState, undefined, 2))
      }
    }

    return (
      <AnimatedBackground image={backgroundImage} hideNotifications={true} >
        <BleStatusBar bleState={this.state.bleState} />
        <SlideInView hidden={true} height={50} visible={this.state.bleState !== BLE_STATE_READY && this.state.bleState !== BLE_STATE_BUSY}>
          <TouchableOpacity onPress={triggerErrorMessage} style={{paddingLeft: 10, paddingRight: 10, backgroundColor: colors.red.hex, borderBottomWidth: 1, borderBottomColor: colors.black.rgba(0.2), height: 50, ...styles.centered}}>
            <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.white.hex}}>{ "Error during BLE command." }</Text>
          </TouchableOpacity>
        </SlideInView>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(explanationColor)} separatorIndent={true} />
        </ScrollView>
      </AnimatedBackground>
    )
  }
}


