import { LiveComponent } from "../../LiveComponent";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Stacks } from "../../Stacks";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { core } from "../../../Core";
import { background, colors, styles } from "../../styles";
import { Alert, ScrollView, TouchableOpacity, Text, View } from "react-native";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import React from "react";
import { BleStatusBar } from "./DEV_FirmwareTest";
import { SlideInView } from "../../components/animated/SlideInView";
import { ListEditableItems } from "../../components/ListEditableItems";
import { IconButton } from "../../components/IconButton";
import { xUtil } from "../../../util/StandAloneUtil";
import { CommandAPI } from "../../../logic/constellation/Commander";
import {TESTING_SPHERE_ID} from "../../../backgroundProcesses/dev/DevAppState";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {from, tell} from "../../../logic/constellation/Tellers";


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
    let failed  = () => { core.eventBus.emit("hideNumericOverlayFailed"); }

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
          await this.bleAction(async () => {
            FocusManager.crownstoneState.switchCraftThreshold = await from(this.props.handle).getSwitchcraftThreshold();
          })
          this.forceUpdate();
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await from(this.props.handle).setSwitchcraftThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Max Chip Temp",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.maxChipTemp || null,
        getCallback: async () => {
          await this.bleAction(async () => {
            FocusManager.crownstoneState.maxChipTemp = await from(this.props.handle).getMaxChipTemp();
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
          await this.bleAction(async () => {
            FocusManager.crownstoneState.dimmerCurrentThreshold = from(this.props.handle).getDimmerCurrentThreshold()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setDimmerCurrentThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Dimmer Temp Up",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempUpThreshold || null,
        getCallback: async () => {
          await this.bleAction(async () => {
            FocusManager.crownstoneState.dimmerTempUpThreshold = await from(this.props.handle).getDimmerTempUpThreshold;
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setDimmerTempUpThreshold(value);
            success();
          }, failed);
        }
      });

      items.push({
        label: "Dimmer Temp Down",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.dimmerTempDownThreshold || null,
        getCallback: async () => {
          await this.bleAction(async () => {
            FocusManager.crownstoneState.dimmerTempDownThreshold = await from(this.props.handle).getDimmerTempDownThreshold()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setDimmerTempDownThreshold(value);
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
          await this.bleAction(async () => {
            FocusManager.crownstoneState.voltageZero = await from(this.props.handle).getVoltageZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setVoltageZero(value);
            success();
          }, failed);
        }
      });
      items.push({
        label: "Current Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.currentZero || null,
        getCallback: async () => {
          await this.bleAction(async () => {
            FocusManager.crownstoneState.currentZero = await from(this.props.handle).getCurrentZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setSwitchcraftThreshold(value);
            success();
          }, failed);
        }
      });
      items.push({
        label: "Power Zero",
        type: 'numericGetSet',
        value: FocusManager.crownstoneState.powerZero || null,
        getCallback: async () => {
          await this.bleAction(async () => {
            FocusManager.crownstoneState.powerZero = await from(this.props.handle).getPowerZero()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setPowerZero(value);
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
          await this.bleAction(async () => {
            FocusManager.crownstoneState.voltageMultiplier = await from(this.props.handle).getVoltageMultiplier()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setVoltageMultiplier(value);
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
          await this.bleAction(async () => {
            FocusManager.crownstoneState.currentMultiplier = await from(this.props.handle).getCurrentMultiplier()
            this.forceUpdate();
          })
        },
        setCallback: async (value) => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setCurrentMultiplier(value);
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
          await this.bleAction(async () => {
            await tell(this.props.handle).setUartState(0)
          })
        }
      });
      items.push({
        label: "UART RX ONLY",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setUartState(1)
          })
        }
      });
      items.push({
        label: "UART TX & RX",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: async () => {
          await this.bleAction(async () => {
            await tell(this.props.handle).setUartState(3)
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
        await this.bleAction(async () => {
          data = await from(this.props.handle).getBehaviourDebugInformation()
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
    let backgroundImage = background.main;
    let explanationColor = colors.black.rgba(0.9);

    switch (FocusManager.crownstoneMode ) {
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


