import { LiveComponent } from "../../LiveComponent";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Stacks } from "../../Stacks";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { ConnectionManager } from "../../../backgroundProcesses/dev/ConnectionManager";
import { core } from "../../../Core";
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
import { xUtil } from "../../../util/StandAloneUtil";
import { LOGe } from "../../../logging/Log";
import { CommandAPI } from "../../../logic/constellation/Commander";


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


  async bleAction(action : (api: CommandAPI) => Promise<any>, failureHandler: () => void = () => {}) {
    if (this.state.bleState === BLE_STATE_BUSY) {
      Toast.showWithGravity('  Bluetooth Busy!  ', Toast.SHORT, Toast.CENTER);
      return;
    }
    this.setState({bleState: BLE_STATE_BUSY})

    try {
      let state = core.store.getState();
      let api = await ConnectionManager.connect(this.props.handle, FocusManager.crownstoneState.referenceId || state.devApp.sphereUsedForSetup);
      await action(api);
      await ConnectionManager.disconnect()
    }
    catch (err) {
      this.showBleError(err);
      await ConnectionManager.disconnect()
    }
    finally {
      this.setState({bleState: BLE_STATE_READY});
    }
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
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.switchCraftThreshold = await api.getSwitchcraftThreshold();
          })
          this.forceUpdate();
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setSwitchcraftThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Max Chip Temp",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.maxChipTemp || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.maxChipTemp = await api.getMaxChipTemp();
          })
          this.forceUpdate();
        },
      });

      items.push({label: "DIMMER", type: 'explanation', color: explanationColor});
      items.push({
        label: "Dimmer Threshold",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerCurrentThreshold || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.dimmerCurrentThreshold = api.getDimmerCurrentThreshold()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setDimmerCurrentThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Dimmer Temp Up",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempUpThreshold || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.dimmerTempUpThreshold = await api.getDimmerTempUpThreshold;
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setDimmerTempUpThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Dimmer Temp Down",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempDownThreshold || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.dimmerTempDownThreshold = await api.getDimmerTempDownThreshold()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setDimmerTempDownThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({label: "POWER MEASUREMENT", type: 'explanation', color: explanationColor});
      items.push({
        label: "Voltage Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.voltageZero || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.voltageZero = await api.getVoltageZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setVoltageZero(value);
            success();
          }, failed);
        }
      });
      items.push({
        label: "Current Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.currentZero || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.currentZero = await api.getCurrentZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setSwitchcraftThreshold(value);
            success();
          }, failed);
        }
      });
      items.push({
        label: "Power Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.powerZero || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.powerZero = await api.getPowerZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setPowerZero(value);
            success();
          }, failed);
        }
      });


      items.push({label: "ADC CONFIG", type: 'explanation', color: explanationColor});
      items.push({
        label: "Voltage Multiplier",
        type: 'numericGetSet',
        digits: 6,
        value: FocusManager.crownstoneState.voltageMultiplier || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.voltageMultiplier = await api.getVoltageMultiplier()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setVoltageMultiplier(value);
            success();
          }, failed);
        }
      });
      items.push({
        label: "Current Multiplier",
        type: 'numericGetSet',
        digits: 6,
        value: FocusManager.crownstoneState.currentMultiplier || null,
        getCallback: async () => {
          await this.bleAction(async(api) => {
            FocusManager.crownstoneState.currentMultiplier = await api.getCurrentMultiplier()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async(api) => {
            await api.setCurrentMultiplier(value);
            success();
          }, failed);
        }
      });



      items.push({label: "DEV COMMANDS", type: 'explanation', color: explanationColor});
      items.push({
        label: "Disable UART",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async(api) => {
            await api.setUartState(0)
          })
        }
      });
      items.push({
        label: "UART RX ONLY",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async(api) => {
            await api.setUartState(1)
          })
        }
      });
      items.push({
        label: "UART TX & RX",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async(api) => {
            await api.setUartState(3)
          })
        }
      });
    }

    items.push({
      label: "Get Behaviour Debug Information",
      icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueDark.hex }}/>,
      type: 'navigation',
      callback: async () => {
        this.setState({debugInformation: null});
        let data : behaviourDebug = null;
        let formattedData : any = {};
        await this.bleAction(async(api) => {
          data = await api.getBehaviourDebugInformation()
        });
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

        formattedData.activeBehaviours = mapBitmaskArray(data.activeBehaviours);
        formattedData.activeEndConditions = mapBitmaskArray(data.activeEndConditions);

        formattedData.behavioursInTimeoutPeriod = mapBitmaskArray(data.behavioursInTimeoutPeriod);

        formattedData.presenceProfile_0 = mapBitmaskArray(data.presenceProfile_0);
        formattedData.presenceProfile_1 = mapBitmaskArray(data.presenceProfile_1);
        formattedData.presenceProfile_2 = mapBitmaskArray(data.presenceProfile_2);
        formattedData.presenceProfile_3 = mapBitmaskArray(data.presenceProfile_3);
        formattedData.presenceProfile_4 = mapBitmaskArray(data.presenceProfile_4);
        formattedData.presenceProfile_5 = mapBitmaskArray(data.presenceProfile_5);
        formattedData.presenceProfile_6 = mapBitmaskArray(data.presenceProfile_6);
        formattedData.presenceProfile_7 = mapBitmaskArray(data.presenceProfile_7);

        formattedData.storedBehaviours = mapBitmaskArray(data.storedBehaviours);

        let str = xUtil.stringify(data, 2);
        console.log("STONE DEBUG INFORMATION:", str);
        this.setState({debugInformation: str});
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
        backgroundImage = require('../../../../assets/images/backgrounds/blueBackground2.jpg');
        break;
      case "verified":
        backgroundImage = background.light;
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


