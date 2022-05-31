import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { Stacks } from "../../Stacks";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { core } from "../../../Core";
import { SetupHelper } from "../../../native/setup/SetupHelper";
import { BroadcastStateManager } from "../../../backgroundProcesses/BroadcastStateManager";
import { background, colors, screenWidth, styles } from "../../styles";
import { Alert, Platform, ScrollView, TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import { SlideInView } from "../../components/animated/SlideInView";
import React from "react";
import { ListEditableItems } from "../../components/ListEditableItems";
import { Icon } from "../../components/Icon";
import {DevAppState, TESTING_SPHERE_ID} from "../../../backgroundProcesses/dev/DevAppState";
import {tell} from "../../../logic/constellation/Tellers";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";

const BLE_STATE_READY = "ready";
const BLE_STATE_BUSY = "busy";


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
    }
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("FOCUS_RSSI_UPDATE", () => {
      TopBarUtil.updateOptions(this.props.componentId, {
        title:   FocusManager.name+ " [" + FocusManager.crownstoneState.stoneId + "] "+FocusManager.crownstoneState.rssiAverage,
        leftNav: {id: 'back', text:'Back'}
      });
    }));

    this.unsubscribe.push(core.eventBus.on("FOCUS_UPDATE", () => {
      this.forceUpdate();
    }));
  }

  componentWillUnmount(): void {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }


  async bleAction(action : () => Promise<any> | void, failureHandler: () => void = () => {}) {
    if (this.state.bleState === BLE_STATE_BUSY) {
      return;
    }
    this.setState({bleState: BLE_STATE_BUSY})

    try {
      let state = core.store.getState();
      // Constellation depends on the MapProvider for ID resolving. This should cover that case along with the same code in the stoneSelector update method.
      // The check here is required since setup might be done in the views using this class.
      let sphereId = FocusManager.crownstoneState.referenceId || state.devApp.sphereUsedForSetup;
      if (sphereId === TESTING_SPHERE_ID) {
        MapProvider.stoneHandleMap[this.props.handle] = {
          id: null,
          cid: 0,
          handle: this.props.handle,
          name: "devStone",
          sphereId: TESTING_SPHERE_ID,
          stone: {},
          stoneConfig: {},
        }
      }
      else {
        if (MapProvider.stoneHandleMap[this.props.handle]?.sphereId === TESTING_SPHERE_ID) {
          MapProvider.refreshAll();
        }
      }
      await action();
      this.setState({bleState: BLE_STATE_READY});
    }
    catch (err) {
      this.showBleError(err);
    }
  }

  _setupCrownstone() {
    if (this.state.bleState === BLE_STATE_BUSY) {
      return;
    }

    let state = core.store.getState();
    let useCloud = false;
    if (state.devApp.storeCrownstonesInCloud && state.devApp.sphereUsedForSetup !== DevAppState.sphereId) {
      useCloud = true;
    }

    let setupData = null;
    if (state.devApp.sphereUsedForSetup === DevAppState.sphereId) {
      setupData = DevAppState.getSetupData();
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
    this.setState({ bleState: err?.message });
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

    items.push({label: "OPERATIONS", type: 'explanation', below: false, color: explanationColor});
    if (FocusManager.crownstoneMode === 'setup') {
      items.push({
        label: "Reboot Crownstone",
        type: 'button',
        style: { color: colors.blue.hex },
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).restartCrownstone() })
        }
      });
      items.push({
        label: this.state.setupActive ? "Setting up Crownstone..." : "Perform setup",
        type: 'button',
        style: {color:colors.blue.hex},
        progress: this.state.setupProgress,
        callback: () => {
          this._setupCrownstone();
        }
      });
      items.push({label: "Using sphere: \"" + sphereName+ "\" for setup.", type: 'explanation', below: true, color: explanationColor});
    }
    else if (FocusManager.crownstoneMode === "verified") {
      items.push({
        label: "Reboot Crownstone",
        type: 'button',
        style: { color: colors.blue.hex },
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).restartCrownstone() })
        }
      });
      items.push({
        label: "Factory Reset",
        type: 'button',
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).commandFactoryReset() })
        }
      });
      items.push({label: "Put your Crownstone back in setup mode.", type: 'explanation', below: true, color: explanationColor});

      items.push({
        label: "Recover",
        type: 'button',
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).recover() })
        }
      });
      items.push({label: "Recovery is possible in the first 30 seconds after power on.", type: 'explanation', below: true, color: explanationColor});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({
        label: "Back to normal mode",
        type: 'button',
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).bootloaderToNormalMode() })
        }
      });
      items.push({label: "Put your Crownstone back into app mode.", type: 'explanation', below: true, color: explanationColor});
    }
    else {
      items.push({
        label: "Recover",
        type: 'button',
        callback: async () => {
          await this.bleAction(() => { return tell(this.props.handle).recover() })
        }
      });
      items.push({label: "Recovery is possible in the first 30 seconds after power on.", type: 'explanation', below: true, color: explanationColor});
    }



    items.push({label: "CONTROL", type: 'explanation', below: false, color: explanationColor, alreadyPadded:true});
    if (FocusManager.crownstoneMode === 'unverified') {
      items.push({label: "Disabled for unverified Crownstone.", type: 'info'});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({label: "Disabled for Crownstone in DFU mode.", type: 'info'});
    }
    else {
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: "Set Switch",
          type: 'slider',
          disabled: FocusManager.crownstoneState.switchState === null,
          value: FocusManager.crownstoneState.switchStateValue,
          step: 1,
          min: 0,
          max: 100,
          callback: async (value) => {
            await this.bleAction(async () => {
              await tell(this.props.handle).setSwitchState(value)
              FocusManager.crownstoneState.switchStateValue = value;
              this.forceUpdate();
            })
          }
        });
      }
      else {
        items.push({
          label: "Set Switch",
          type: 'switch',
          disabled: FocusManager.crownstoneState.switchStateValue === null,
          value: FocusManager.crownstoneState.switchStateValue === 1,
          callback: async (value) => {
            await this.bleAction(async () => {
              await tell(this.props.handle).setSwitchState(value ? 100 : 0)
              FocusManager.crownstoneState.switchStateValue = value ? 100 : 0;
              this.forceUpdate();
            })
          }
        });
      }
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: "Cast Switch",
          type: 'slider',
          disabled: FocusManager.crownstoneState.switchState === null,
          value: FocusManager.crownstoneState.switchStateValue,
          step: 1,
          min: 0,
          max: 100,
          callback: async  (value) => {
            await this.bleAction(async () => {
              await tell(this.props.handle).multiSwitch(value)
              FocusManager.crownstoneState.switchStateValue = value;
              this.forceUpdate();
            })
          }
        });
      }
      else {
        items.push({
          label: "Cast Switch",
          type: 'switch',
          disabled: FocusManager.crownstoneState.switchStateValue === null,
          value: FocusManager.crownstoneState.switchStateValue === 1,
          callback: async (value) => {
            await this.bleAction(async () => {
              await tell(this.props.handle).multiSwitch(value ? 100 : 0)
              FocusManager.crownstoneState.switchStateValue = value ? 100 : 0;
              this.forceUpdate();
            })
          }
        });
      }
      items.push({
        label: "Set Relay",
        type: 'switch',
        disabled: FocusManager.crownstoneState.relayState === null,
        value: FocusManager.crownstoneState.relayState === 1,
        callback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).switchRelay(value)
            FocusManager.crownstoneState.relayState = value ? 1 : 0;
            this.forceUpdate();
          })
        }
      });
      if (FocusManager.crownstoneState.dimmingEnabled) {
        items.push({
          label: "Set Dimmer",
          type: 'slider',
          disabled: FocusManager.crownstoneState.dimmerState === null,
          value: FocusManager.crownstoneState.dimmerState,
          step: 1,
          min: 0,
          max: 100,
          callback: async (value) => {
            await this.bleAction(async () => {
              await tell(this.props.handle).switchDimmer(value)
              FocusManager.crownstoneState.dimmerState = value;
              this.forceUpdate();
            })
          }
        });

        items.push({
          label: "Set Dimmer",
          type: 'numericSet',
          digits:0,
          disabled: FocusManager.crownstoneState.dimmerState === null,
          value: FocusManager.crownstoneState.dimmerState,
          setCallback: async (value) => {
            let num = Math.max(0, Math.min(100, Number(value)));
            await this.bleAction(async () => {
              await tell(this.props.handle).switchDimmer(num);
              FocusManager.crownstoneState.dimmerState = num;
              core.eventBus.emit("hideNumericOverlaySuccess");
              this.forceUpdate();
            })
          }
        });
      }
      else {
        items.push({label: "Dimming is disabled.", type: 'info'});
      }
    }

    items.push({label: "CONFIG", type: 'explanation', below: false, color: explanationColor});
    if (FocusManager.crownstoneMode === 'unverified' ) {
      items.push({label: "Disabled for unverified Crownstone.", type: 'info'});
    }
    else if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({label: "Disabled for Crownstone in DFU mode.", type: 'info'});
    }
    else {
      items.push({
        label: "Allow Dimming",
        type: 'switch',
        disabled: FocusManager.crownstoneState.dimmingEnabled === null,
        value: FocusManager.crownstoneState.dimmingEnabled,
        callback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).allowDimming(value)
            FocusManager.crownstoneState.dimmingEnabled = value;
            this.forceUpdate();
          })
        }
      });
      items.push({
        label: "Switch Locked",
        type: 'switch',
        disabled: FocusManager.crownstoneState.locked === null,
        value: FocusManager.crownstoneState.locked,
        callback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).lockSwitch(value)
            FocusManager.crownstoneState.locked = value;
            this.forceUpdate();
          })
        }
      });
      items.push({
        label: "Switchcraft",
        type: 'switch',
        disabled: FocusManager.crownstoneState.switchCraft === null,
        value: FocusManager.crownstoneState.switchCraft,
        callback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setSwitchCraft(value)
            FocusManager.crownstoneState.switchCraft = value;
            this.forceUpdate();
          })
        }
      });
      items.push({
        label: "Reset Errors",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async () => {
            await tell(this.props.handle).clearErrors({
              dimmerOnFailure:    true,
              dimmerOffFailure:   true,
              temperatureDimmer:  true,
              temperatureChip:    true,
              overCurrentDimmer:  true,
              overCurrent:        true,
            })
          })
        }
      });
      items.push({
        label: "Set time",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setTime()
          })
        }
      });
    }

    items.push({ label: "GET INFORMATION", type: 'explanation', color: explanationColor });

    if (Platform.OS === 'android') {
      items.push({
        label: "MAC address",
        type: 'info',
        value: FocusManager.crownstoneState.macAddress,
      });
    }
    else if (FocusManager.crownstoneMode === 'setup') {
      items.push({
        label: "MAC address",
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.macAddress,
        getter: async () => {
          await this.bleAction(async () => {
            let macAddress = await tell(this.props.handle).getMACAddress()
            FocusManager.crownstoneState.macAddress = macAddress;
            this.forceUpdate();
          })
        }
      });
    }
    if (FocusManager.crownstoneMode === 'dfu' ) {
      items.push({
        label: "Bootloader Version",
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.bootloaderVersion,
        getter: async () => {
          await this.bleAction(async () => {
            let bootloaderVersion = await tell(this.props.handle).getBootloaderVersion()
            FocusManager.crownstoneState.bootloaderVersion = bootloaderVersion;
            this.forceUpdate();
          })
        }
      });
    }
    else {
      items.push({
        label: "Firmware Version",
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.firmwareVersion,
        getter: async () => {
          await this.bleAction(async () => {
            let firmwareVersion = await tell(this.props.handle).getFirmwareVersion()
            FocusManager.crownstoneState.firmwareVersion = firmwareVersion;
            this.forceUpdate();
          })
        }
      });
    }


    if (FocusManager.crownstoneMode !== 'dfu' ) {
      items.push({
        label: "Hardware Version",
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.hardwareVersion,
        getter: async () => {
          await this.bleAction(async () => {
            let hardwareVersion = await tell(this.props.handle).getHardwareVersion();
            FocusManager.crownstoneState.hardwareVersion = hardwareVersion;
            this.forceUpdate();
          });
        }
      });


      items.push({
        label: "Reset Counter",
        type: 'buttonGetValue',
        value: FocusManager.crownstoneState.resetCounter,
        getter: async () => {
          await this.bleAction(async () => {
            let resetCounter = await tell(this.props.handle).getResetCounter();
            FocusManager.crownstoneState.resetCounter = resetCounter;
            this.forceUpdate();
          })
        }
      });

      if (FocusManager.crownstoneMode === "verified") {
        let state = core.store.getState();
        let sphere = state.spheres[FocusManager.crownstoneState.referenceId];
        if (sphere) {
          items.push({
            label: "In Sphere " + sphereName,
            type: 'explanation',
            below: false,
            color: explanationColor
          });
        }
      }

      if (FocusManager.crownstoneMode !== 'unverified') {
        items.push({
          label: "Go in DFU mode",
          type: 'button',
          style: { color: colors.red.hex },
          callback: async () => {
            await this.bleAction(async () => {
              await tell(this.props.handle).putInDFU()
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
    let backgroundImage = background.main;
    let explanationColor = colors.black.rgba(0.9);

    switch (FocusManager.crownstoneMode) {
      case "setup":
        explanationColor = colors.white.hex;
        backgroundImage = require('../../../../assets/images/backgrounds/blueBackground2.jpg');
        break;
      case "verified":
        backgroundImage = background.main;
        break;
      case "unverified":
        backgroundImage = background.menu;
        break;
      case "dfu":
        backgroundImage = require('../../../../assets/images/backgrounds/upgradeBackground.jpg');
        break;
    }

    if (FocusManager.crownstoneState.error) {
      backgroundImage = require('../../../../assets/images/backgrounds/somethingWrong.jpg');
      explanationColor = colors.white.rgba(0.5);
    }

    let triggerErrorMessage = () => {
      if (!(this.state.bleState === BLE_STATE_READY || this.state.bleState === BLE_STATE_BUSY)) {
        Alert.alert("BLE Error:", JSON.stringify(this.state.bleState, undefined, 2))
      }
    }

    return (
      <AnimatedBackground image={backgroundImage}>
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
        label={ "BLE"}
        icon={'ios-bluetooth'}
        pending={props.bleState === BLE_STATE_BUSY}
        backgroundColor={props.bleState === BLE_STATE_READY || props.bleState === BLE_STATE_BUSY ? colors.green.hex : colors.red.hex}
        callback={() => {
          triggerErrorMessage();
        }}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ "HW Errors"}
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
        label={ "Temp"}
        icon={'md-thermometer'}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.temperature === null}
        value={FocusManager.crownstoneState.temperature + " C"}
        backgroundColor={colors.green.blend(colors.red, (FocusManager.crownstoneState.temperature - 40) / 40).hex}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ "Power"}
        icon={'ios-flash'}
        disabled={FocusManager.crownstoneMode === 'unverified'}
        pending={FocusManager.crownstoneState.powerUsage === null}
        value={FocusManager.crownstoneState.powerUsage + " W"}
        backgroundColor={colors.green.blend(colors.red, FocusManager.crownstoneState.powerUsage / 4000).hex}
      />
      <View style={{flex:1}} />
      <StatusIndicator
        label={ "Dimmer"}
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
