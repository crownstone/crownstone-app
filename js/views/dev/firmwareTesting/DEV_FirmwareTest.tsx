
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DEV_FirmwareTest", key)(a,b,c,d,e);
}
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { Stacks } from "../../../router/Stacks";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { ConnectionManager } from "../../../backgroundProcesses/dev/ConnectionManager";
import { core } from "../../../core";
import Toast from 'react-native-same-toast';
import { BleUtil } from "../../../util/BleUtil";
import { SetupHelper } from "../../../native/setup/SetupHelper";
import { BroadcastStateManager } from "../../../backgroundProcesses/BroadcastStateManager";
import { colors, screenWidth, styles } from "../../styles";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { StoneUtil } from "../../../util/StoneUtil";
import { Alert, Platform, ScrollView, TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import { SlideInView } from "../../components/animated/SlideInView";
import React from "react";
import { ListEditableItems } from "../../components/ListEditableItems";
import { Icon } from "../../components/Icon";
import { DevAppState } from "../../../backgroundProcesses/dev/DevAppState";
import { BlePromiseManager } from "../../../logic/BlePromiseManager";

const BLE_STATE_READY = "ready";
const BLE_STATE_BUSY = "busy";

const PROXY_OPTIONS = {keepConnectionOpen: true}

export class DEV_FirmwareTest extends LiveComponent<{
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
  cachedCommand = null;
  cachedCommandTimeout = null;
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      bleState: BLE_STATE_READY,
      setupActive: false,
      setupProgress: 0
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
      TopBarUtil.updateOptions(this.props.componentId, { title: lang("____",FocusManager.name,FocusManager.crownstoneState.stoneId,FocusManager.crownstoneState.rssiAverage)})
    }));

    this.unsubscribe.push(core.eventBus.on("FOCUS_UPDATE", () => {
      this.forceUpdate();
    }));
  }

  componentWillUnmount(): void {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }


  bleAction(action : (...any) => Promise<any>, props = [], type = null, resultHandler = (any) => {}, connect = true, immediate = false) {
    clearTimeout(this.cachedCommandTimeout);

    if (this.state.bleState === BLE_STATE_BUSY) {
      if (immediate === false) {
        console.log("BUSY, postponing")
        this.cachedCommand = { action, props, type, resultHandler, connect, immediate };
        this.cachedCommandTimeout = setTimeout(() => {
          this.bleAction(
            this.cachedCommand.action,
            this.cachedCommand.props,
            this.cachedCommand.type,
            this.cachedCommand.resultHandler,
            this.cachedCommand.connect,
            this.cachedCommand.immediate,
          );
        }, 400);

        // Toast.showWithGravity('  Bluetooth Busy!  ', Toast.SHORT, Toast.CENTER);
      }
      return;
    }

    FocusManager.setUpdateFreeze(type);


    let promise = null;
    this.setState({bleState: BLE_STATE_BUSY});
    let state = core.store.getState();

    if (connect) {
      ConnectionManager.connectWillStart()
      let proxy = BleUtil.getProxy(this.props.handle, FocusManager.crownstoneState.referenceId || state.devApp.sphereUsedForSetup);
      promise = proxy.performPriority(action, props, PROXY_OPTIONS)
    }
    else {
      ConnectionManager.disconnect()
      let actionPromise = () => {
        if (immediate) {
          return new Promise((resolve, reject) => {
            // @ts-ignore
            action.apply(this, props).catch((err) => {});
            setTimeout(() => {
              resolve();
            },100);
          })
        }
        return action.apply(this, props);
      };
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
        this.showBleError(err);
        if (connect) { ConnectionManager.disconnect() }
      })
  }


  _setupCrownstone() {
    if (this.state.bleState === BLE_STATE_BUSY) {
      Toast.showWithGravity('  Bluetooth Busy!  ', Toast.SHORT, Toast.CENTER);
      return;
    }

    let state = core.store.getState();
    let useCloud = false;
    if (state.devApp.storeCrownstonesInCloud && state.devApp.sphereUsedForSetup !== DevAppState.sphereId) {
      useCloud = true;
    }

    let setupData = null;
    if (state.devApp.sphereUsedForSetup === DevAppState.sphereId) {
      setupData = DevAppState.getSetupData()
    }

    clearTimeout(this.bleStateResetTimeout);
    this.setState({setupActive: true, setupProgress:0, bleState: BLE_STATE_BUSY})

    let helper = new SetupHelper(
      this.props.handle,
      "Dev Crownstone",
      this.props.item.serviceData.deviceType,
      "c2-crownstone",
      useCloud,
      setupData
    );
    let unsubscribeSetupEvents = [];
    unsubscribeSetupEvents.push(core.eventBus.on("setupCancelled", (handle) => {
      this.setState({setupActive: false, setupProgress: 0});
    }));
    unsubscribeSetupEvents.push(core.eventBus.on("setupInProgress", (data) => {
      this.setState({setupProgress: data.progress/20});
    }));
    unsubscribeSetupEvents.push(core.eventBus.on("setupComplete", (handle) => {
      this.setState({setupActive: false, setupProgress: 1});
    }));
    helper.claim(state.devApp.sphereUsedForSetup, false)
      .then(() => {
        unsubscribeSetupEvents.forEach((unsub) => { unsub() });
        this.setState({bleState: BLE_STATE_READY, setupActive: false, setupProgress:0})
        BroadcastStateManager._updateLocationState(state.devApp.sphereUsedForSetup);
        BroadcastStateManager._reloadDevicePreferences();
      })
      .catch((err) => {
        this.setState({setupActive: false, setupProgress:0})
        this.showBleError(err);
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
    const store = core.store;
    let state = store.getState();

    let sphereName = DevAppState.name;
    if (state.spheres[state.devApp.sphereUsedForSetup] !== undefined) {
      sphereName = state.spheres[state.devApp.sphereUsedForSetup].config.name
    }


    let items = [];

    items.push({label: lang("OPERATIONS"), type: 'explanation', below: false, color: explanationColor});
    if (FocusManager.crownstoneMode === 'setup') {
      items.push({
        label: lang("Reboot_Crownstone"),
        type: 'button',
        style: { color: colors.blue.hex },
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.restartCrownstone)
        }
      });
      items.push({
        label: lang("Setting_up_Crownstone___P",this.state.setupActive),
        type: 'button',
        style: {color:colors.blue.hex},
        progress: this.state.setupProgress,
        callback: () => {
          this._setupCrownstone();
        }
      });
      items.push({label: lang("Using_sphere_______for_se",sphereName), type: 'explanation', below: true, color: explanationColor});
    }
    else if (FocusManager.crownstoneMode === "verified") {
      items.push({
        label: lang("Reboot_Crownstone"),
        type: 'button',
        style: { color: colors.blue.hex },
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.restartCrownstone)
        }
      });
      items.push({
        label: lang("Factory_Reset"),
        type: 'button',
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.commandFactoryReset)
        }
      });
      items.push({label: lang("Put_your_Crownstone_back_"), type: 'explanation', below: true, color: explanationColor});
    }
    else if (FocusManager.crownstoneMode === 'unverified') {
      items.push({
        label: lang("Recover"),
        type: 'button',
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.recover, [this.props.handle], null, () => {}, false);
        }
      });
      items.push({label: lang("Recovery_is_possible_in_t"), type: 'explanation', below: true, color: explanationColor});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({
        label: lang("Back_to_normal_mode"),
        type: 'button',
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.bootloaderToNormalMode, [this.props.handle], null, () => {}, false);
        }
      });
      items.push({label: lang("Put_your_Crownstone_back_i"), type: 'explanation', below: true, color: explanationColor});
    }



    items.push({label: lang("CONTROL"), type: 'explanation', below: false, color: explanationColor, alreadyPadded:true});
    if (FocusManager.crownstoneMode === 'unverified') {
      items.push({label: lang("Disabled_for_unverified_C"), type: 'info'});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({label: lang("Disabled_for_Crownstone_i"), type: 'info'});
    }
    else {
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: lang("Set_Switch"),
          type: 'slider',
          disabled: FocusManager.crownstoneState.switchState === null,
          value: FocusManager.crownstoneState.switchStateValue,
          step: 0.025,
          min: 0,
          max: 1,
          callback: (value) => {
            this.bleAction(BluenetPromiseWrapper.setSwitchState, [value], 'switchState')
            FocusManager.crownstoneState.switchStateValue = value;
            this.forceUpdate();
          }
        });
      }
      else {
        items.push({
          label: lang("Set_Switch"),
          type: 'switch',
          disabled: FocusManager.crownstoneState.switchStateValue === null,
          value: FocusManager.crownstoneState.switchStateValue === 1,
          callback: (value) => {
            this.bleAction(BluenetPromiseWrapper.setSwitchState, [value ? 1 : 0], 'switchState')
            FocusManager.crownstoneState.switchStateValue = value ? 1 : 0;
            this.forceUpdate();
          }
        });
      }
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: lang("Cast_Switch"),
          type: 'slider',
          disabled: FocusManager.crownstoneState.switchState === null,
          value: FocusManager.crownstoneState.switchStateValue,
          step: 0.025,
          min: 0,
          max: 1,
          callback: (value) => {
            this.bleAction(BluenetPromiseWrapper.broadcastSwitch, [FocusManager.crownstoneState.referenceId, FocusManager.crownstoneState.stoneId, value, true], 'switchState', () => {}, false, true)
            FocusManager.crownstoneState.switchStateValue = value;
            this.forceUpdate();
          }
        });
      }
      else {
        items.push({
          label: lang("Cast_Switch"),
          type: 'switch',
          disabled: FocusManager.crownstoneState.switchStateValue === null,
          value: FocusManager.crownstoneState.switchStateValue === 1,
          callback: (value) => {
            this.bleAction(BluenetPromiseWrapper.broadcastSwitch, [FocusManager.crownstoneState.referenceId, FocusManager.crownstoneState.stoneId, value ? 1 : 0, true], 'switchState',() => {},false, true);
            FocusManager.crownstoneState.switchStateValue = value ? 1 : 0;
            this.forceUpdate();
          }
        });
      }
      items.push({
        label: lang("Set_Relay"),
        type: 'switch',
        disabled: FocusManager.crownstoneState.relayState === null,
        value: FocusManager.crownstoneState.relayState === 1,
        callback: (value) => {
          this.bleAction(BluenetPromiseWrapper.switchRelay, [value], 'relayState');
          FocusManager.crownstoneState.relayState = value ? 1 : 0;
          this.forceUpdate();
        }
      });
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: lang("Set_Dimmer"),
          type: 'slider',
          disabled: FocusManager.crownstoneState.dimmerState === null,
          value: FocusManager.crownstoneState.dimmerState,
          step: 0.01,
          min: 0,
          max: 0.99,
          callback: (value) => {
            this.bleAction(BluenetPromiseWrapper.switchDimmer, [value], 'dimmerState');
            FocusManager.crownstoneState.dimmerState = value;
            this.forceUpdate();
          }
        });

        items.push({
          label: lang("Set_Dimmer"),
          type: 'numericSet',
          digits:2,
          disabled: FocusManager.crownstoneState.dimmerState === null,
          value: FocusManager.crownstoneState.dimmerState,
          setCallback: (value) => {
            let num = Math.max(0, Math.min(1, Number(value)));
            this.bleAction(BluenetPromiseWrapper.switchDimmer, [num], 'dimmerState', () => {
              FocusManager.crownstoneState.dimmerState = num;
              core.eventBus.emit("hideNumericOverlaySuccess");
              this.forceUpdate();
            })
          }
        });
      }
      else {
        items.push({label: lang("Dimming_is_disabled_"), type: 'info'});
      }
    }

    items.push({label: lang("CONFIG"), type: 'explanation', below: false, color: explanationColor});
    if (FocusManager.crownstoneMode === 'unverified' ) {
      items.push({label: lang("Disabled_for_unverified_Cr"), type: 'info'});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({label: lang("Disabled_for_Crownstone_in"), type: 'info'});
    }
    else {
      items.push({
        label: lang("Allow_Dimming"),
        type: 'switch',
        disabled: FocusManager.crownstoneState.dimmingEnabled === null,
        value: FocusManager.crownstoneState.dimmingEnabled,
        callback: (value) => {
          this.bleAction(BluenetPromiseWrapper.allowDimming, [value], 'dimmingEnabled')
          FocusManager.crownstoneState.dimmingEnabled = value;
        }
      });
      items.push({
        label: lang("Switch_Locked"),
        type: 'switch',
        disabled: FocusManager.crownstoneState.locked === null,
        value: FocusManager.crownstoneState.locked,
        callback: (value) => {
          this.bleAction(BluenetPromiseWrapper.lockSwitch, [value], 'locked');
          FocusManager.crownstoneState.locked = value;
        }
      });
      items.push({
        label: lang("Switchcraft"),
        type: 'switch',
        disabled: FocusManager.crownstoneState.switchCraft === null,
        value: FocusManager.crownstoneState.switchCraft,
        callback: (value) => {
          this.bleAction(BluenetPromiseWrapper.setSwitchCraft, [value], 'switchCraft')
          FocusManager.crownstoneState.switchCraft = value;
        }
      });
      items.push({
        label: lang("Reset_Errors"),
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.clearErrors, [{
            dimmerOnFailure:    true,
            dimmerOffFailure:   true,
            temperatureDimmer:  true,
            temperatureChip:    true,
            overCurrentDimmer:  true,
            overCurrent:        true,
          }])
        }
      });
      items.push({
        label: lang("Set_time"),
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.bleAction(BluenetPromiseWrapper.setTime, [StoneUtil.nowToCrownstoneTime()])
        }
      });
    }

    items.push({ label: lang("GET_INFORMATION"), type: 'explanation', color: explanationColor });

    if (Platform.OS === 'android') {
      items.push({
        label: lang("MAC_address"),
        type: 'info',
        value: FocusManager.crownstoneState.macAddress,
      });
    }
    else if (FocusManager.crownstoneMode === 'setup') {
      items.push({
        label: lang("MAC_address"),
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.macAddress,
        getter: () => {
          this.bleAction(BluenetPromiseWrapper.getMACAddress, [], null, (macAddress) => {
            FocusManager.crownstoneState.macAddress = macAddress.data;
            this.forceUpdate();
          })
        }
      });
    }
    if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({
        label: lang("Bootloader_Version"),
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.bootloaderVersion,
        getter: () => {
          this.bleAction(BluenetPromiseWrapper.getBootloaderVersion, [], null, (firmwareVersion) => {
            FocusManager.crownstoneState.bootloaderVersion = firmwareVersion.data;
            this.forceUpdate();
          })
        }
      });
    }
    else {
      items.push({
        label: lang("Firmware_Version"),
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.firmwareVersion,
        getter: () => {
          this.bleAction(BluenetPromiseWrapper.getFirmwareVersion, [], null, (firmwareVersion) => {
            FocusManager.crownstoneState.firmwareVersion = firmwareVersion.data;
            this.forceUpdate();
          })
        }
      });
    }


    if (FocusManager.crownstoneMode !== 'dfu' ) {
      items.push({
        label: lang("Hardware_Version"),
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.hardwareVersion,
        getter: () => {
          this.bleAction(BluenetPromiseWrapper.getHardwareVersion, [], null, (hardwareVersion) => {
            FocusManager.crownstoneState.hardwareVersion = hardwareVersion.data;
            this.forceUpdate();
          })
        }
      });


      items.push({
        label: lang("Reset_Counter"),
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.resetCounter,
        getter: () => {
          this.bleAction(BluenetPromiseWrapper.getResetCounter, [], null, (resetCounter) => {
            FocusManager.crownstoneState.resetCounter = resetCounter.data;
            this.forceUpdate();
          })
        }
      });

      if (FocusManager.crownstoneMode === "verified") {
        let state = core.store.getState();
        let sphere = state.spheres[FocusManager.crownstoneState.referenceId];
        if (sphere) {
          items.push({
            label: lang("In_Sphere_",sphereName),
            type: 'explanation',
            below: false,
            color: explanationColor
          });
        }
      }

      if (FocusManager.crownstoneMode !== 'unverified') {
        items.push({
          label: lang("Go_in_DFU_mode"),
          type: 'button',
          style: { color: colors.red.hex },
          callback: () => {
            this.bleAction(BluenetPromiseWrapper.putInDFU, [this.props.handle], null, () => {
            })
          }
        });
      }

    }
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }


  render() {
    let backgroundImage = core.background.light;
    let explanationColor = colors.black.rgba(0.9);

    switch (FocusManager.crownstoneMode ) {
      case "setup":
        explanationColor = colors.white.hex;
        backgroundImage = require('../../../images/backgrounds/blueBackground2.png');
        break;
      case "verified":
        backgroundImage = core.background.light;
        break;
      case "unverified":
        backgroundImage = core.background.menu;
        break;
      case "dfu":
        backgroundImage = require('../../../images/backgrounds/upgradeBackground.png');
        break;
    }

    if (FocusManager.crownstoneState.error) {
      backgroundImage = require('../../../images/backgrounds/somethingWrong.png');
      explanationColor = colors.white.rgba(0.5);
    }

    let triggerErrorMessage = () => {
      if (!(this.state.bleState === BLE_STATE_READY || this.state.bleState === BLE_STATE_BUSY)) {
        Alert.alert("BLE Error:", JSON.stringify(this.state.bleState, undefined, 2))
      }
    }

    return (
      <AnimatedBackground image={backgroundImage} hideNotifications={true}>
        <BleStatusBar bleState={this.state.bleState} />
        <SlideInView hidden={true} height={50} visible={this.state.bleState !== BLE_STATE_READY && this.state.bleState !== BLE_STATE_BUSY}>
          <TouchableOpacity onPress={triggerErrorMessage} style={{paddingLeft: 10, paddingRight: 10, backgroundColor: colors.red.hex, borderBottomWidth: 1, borderBottomColor: colors.black.rgba(0.2), height: 50, ...styles.centered}}>
            <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.white.hex}}>{ lang("Error_during_BLE_command_") }</Text>
          </TouchableOpacity>
        </SlideInView>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(explanationColor)} separatorIndent={true} />
        </ScrollView>
      </AnimatedBackground>
    )
  }
}

export function StatusIndicator(props) {
  let iconColorBase = props.iconColor && props.iconColor.hex || colors.white.hex;
  let iconColor = iconColorBase;
  let backgroundColor = props.backgroundColor;
  if (props.value) {
    iconColor = props.iconColor && props.iconColor.rgba(0.2) || colors.white.rgba(0.2)
  }


  let pending = props.pending;
  if (props.disabled) {
    iconColor = colors.white.rgba(0.75);
    backgroundColor = colors.gray.rgba(0.5)
    pending = false;
  }
  if (pending) {
    backgroundColor = colors.csBlue.rgba(0.5)
  }




  return (
    <TouchableOpacity style={{alignItems:'center'}} onPress={() => { if (props.callback) { props.callback(); } }}>
      {pending ?
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: backgroundColor, ...styles.centered }}>
          <ActivityIndicator size={1} color={colors.white.hex} />
        </View>
        :
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: backgroundColor }}>
          <View style={{ width: 50, height: 50, ...styles.centered, position: 'absolute', top: 0, left: 0 }}>
            <Icon name={props.icon} size={props.iconSize || 30} color={iconColor}/>
          </View>
          {props.value && !props.disabled ? <View
            style={{ width: 50, height: 50, ...styles.centered, position: 'absolute', top: 0, left: 0, padding: 3 }}>
            <Text style={{ fontSize: 15, color: iconColorBase, fontWeight: 'bold' }} minimumFontScale={0.2}
                  numberOfLines={1} adjustsFontSizeToFit={true}>{props.value}</Text></View> : undefined}
        </View>
      }

      <Text style={{fontSize:14, color: props.color || colors.black.rgba(0.8)}}>{props.label}</Text>
    </TouchableOpacity>
  )

}


export function BleStatusBar(props : {bleState}) {

  let triggerErrorMessage = () => {
    if (!(props.bleState === BLE_STATE_READY || props.bleState === BLE_STATE_BUSY)) {
      Alert.alert("BLE Error:", JSON.stringify(props.bleState, undefined, 2))
    }
  }

  return (
    <View style={{flexDirection: 'row', paddingTop: 10, paddingBottom: 10, width:screenWidth, backgroundColor: colors.white.rgba(0.8), borderBottomWidth: 1, borderBottomColor: colors.black.rgba(0.2)}}>
      <View style={{flex:1}} />
      <StatusIndicator
        label={ lang("BLE")}
        icon={'ios-bluetooth'}
        pending={props.bleState === BLE_STATE_BUSY}
        backgroundColor={props.bleState === BLE_STATE_READY || props.bleState === BLE_STATE_BUSY ? colors.green.hex : colors.red.hex}
        callback={() => {
          triggerErrorMessage();
        }}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ lang("HW_Errors")}
        icon={'ios-bug'}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.error === null}
        backgroundColor={FocusManager.crownstoneState.error ? (FocusManager.crownstoneState.errorDetails === null ? colors.csOrange.hex : colors.red.hex) : colors.csBlueDark.hex}
        callback={() => {
          if (FocusManager.crownstoneState.error) {
            if (FocusManager.crownstoneState.errorDetails) {
              Alert.alert("Errors:", JSON.stringify(FocusManager.crownstoneState.errorDetails, undefined, 2))
            } else {
              Alert.alert("Errors:", "No details yet...")
            }
          }
          else {
            Alert.alert("No Hardware Errors.");
          }
        }}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ lang("Temp")}
        icon={'md-thermometer'}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.temperature === null}
        value={FocusManager.crownstoneState.temperature + " C"}
        backgroundColor={colors.green.blend(colors.red, (FocusManager.crownstoneState.temperature - 40) / 40).hex}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ lang("Power")}
        icon={'ios-flash'}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.powerUsage === null}
        value={FocusManager.crownstoneState.powerUsage + " W"}
        backgroundColor={colors.green.blend(colors.red, FocusManager.crownstoneState.powerUsage / 4000).hex}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ lang("Dimmer")}
        icon={'ios-sunny'}
        iconSize={32}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.dimmerReady === null}
        backgroundColor={FocusManager.crownstoneState.dimmerReady ? colors.green.hex : colors.csBlueDark.hex}
      />
      <View style={{flex:1}} />
    </View>
  )

}
