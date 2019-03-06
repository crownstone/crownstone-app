import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { STONE_TYPES } from '../../router/store/reducers/stones'
import {styles, colors, OrangeLine} from '../styles'
import { BluenetPromiseWrapper } from '../../native/libInterface/BluenetPromise'
import { BleUtil } from '../../util/BleUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {LOG, LOGe} from '../../logging/Log'
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Util} from "../../util/Util";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {StoneUtil} from "../../util/StoneUtil";
import { INTENTS } from "../../native/libInterface/Constants";
import {BackAction} from "../../util/Back";
import {CancelButton} from "../components/topbar/CancelButton";
import {TopbarButton} from "../components/topbar/TopbarButton";
import {SphereDeleted} from "../static/SphereDeleted";
import {StoneDeleted} from "../static/StoneDeleted";


export class DeviceEdit extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Edit_Device"),
      headerLeft: <CancelButton onPress={BackAction} />,
      headerRight: <TopbarButton
        text={ lang("Save")}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };

  deleting : boolean = false;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const store = props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return; }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return; }
    let appliance = null;
    if (stone.config.applianceId) {
      appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
    }

    this.state = {
      applianceName: appliance && appliance.config.name || '',
      applianceIcon: appliance && appliance.config.icon || '',
      applianceId: stone.config.applianceId,

      stoneName: stone.config.name,
      stoneIcon: stone.config.icon,
      stoneType: stone.config.type,

      dimmingEnabled: stone.config.dimmingEnabled,
      switchCraft: stone.config.switchCraft,
      tapToToggle: stone.config.tapToToggle,

      showStone: false,

      refreshingStoneVersions: false
    };

    this.props.navigation.setParams({rightAction: () => { this._updateCrownstone();}})
  }

  componentDidMount() {
    const { store } = this.props;

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = store.getState();

      // in case the sphere is deleted
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      if (
        change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        change.updateApplianceConfig
        ) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }



  constructStoneOptions(stone, state) {
    let items = [];
    let canSwitch = stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.plug;
    let hasAppliance = canSwitch && this.state.applianceId;

    if (this.state.applianceId && hasAppliance) {
      items.push({label: lang("PLUGGED_IN_DEVICE_TYPE"), type: 'explanation',  below:false});
      items.push({
        label: lang("Device_Type"),
        type: 'textEdit',
        placeholder:lang("Pick_a_name"),
        value: this.state.applianceName,
        callback: (newText) => {
          this.setState({applianceName: newText});
        }
      });

      // icon picker
      items.push({
        label: lang("Icon"),
        type: 'icon',
        value: this.state.applianceIcon,
        callback: () => {
          Actions.deviceIconSelection({
            icon: this.state.applianceIcon,
            callback: (newIcon) => {
              this.setState({applianceIcon: newIcon})
            }
          })
        }
      });

      // unplug device
      items.push({
        label: lang("Decouple_Device_Type"),
        type: 'button',
        icon: <IconButton name="c1-socket2" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        style: {color: colors.blue.hex},
        callback: () => {
          this.setState({showStone:true, applianceId: null});
        }
      });
      items.push({label: lang("This_Crownstone_is_curren"), type: 'explanation',  below:true, style:{paddingBottom:0}});

      items.push({label: lang("CURRENT_CROWNSTONE_USING_"), type: 'explanation', below: false});
    }
    else {
      items.push({label: lang("CROWNSTONE"), type: 'explanation', below: false});
    }

    items.push({
      label: lang("Name"),
      type: 'textEdit',
      placeholder:lang("Pick_a_name"),
      value: this.state.stoneName,
      callback: (newText) => {
        this.setState({stoneName: newText})
      }
    });


    if (canSwitch) {
      items.push({
        label: lang("Allow_Dimming"),
        type: 'switch',
        icon: <IconButton name="ios-sunny" size={22} button={true} color="#fff"
                          buttonStyle={{backgroundColor: colors.lightCsOrange.hex}}/>,
        value: this.state.dimmingEnabled === true,
        callback: (newValue) => {
          if (Permissions.inSphere(this.props.sphereId).canEnableDimming) {
            this.setState({dimmingEnabled: newValue});
          }
          else {
            Alert.alert(
lang("_Permission_Required__Onl_header"),
lang("_Permission_Required__Onl_body"),
[{text: lang("_Permission_Required__Onl_left")}])
          }
        }
      });

      items.push({
        label: lang("View_Dimming_Compatibilit"), type: 'navigation', callback: () => {
          Linking.openURL('https://crownstone.rocks/compatibility/dimming/').catch(() => {})
        }
      });
      items.push({
        label: lang("Dimming_can_be_enabled_pe"),
        type: 'explanation',
        below: true
      });


      if (state.app.tapToToggleEnabled) {
        items.push({
          label: lang("Tap_to_toggle"),
          icon: <IconButton name="md-color-wand" size={22} button={true} color="#fff"
                            buttonStyle={{backgroundColor: colors.green2.hex}}/>,
          type: 'switch',
          value: this.state.tapToToggle === true,
          callback: (newValue) => {
            this.setState({tapToToggle: newValue});
          }
        });

        items.push({label: lang("Tap_to_toggle_can_be_enab"), type: 'explanation', below: true});
      }
      else {
        items.push({
          label: lang("Tap_to_toggle_is_disabled"),
          type: 'disabledInfo',
          icon: <IconButton name="md-color-wand" size={22} button={true} color="#fff"
                            buttonStyle={{backgroundColor: colors.green2.hex}}/>,
        });
        items.push({
          label: lang("To_use_tap_to_toggle__you"),
          type: 'explanation',
          below: true,
        });
      }

      if (state.user.betaAccess && this.state.stoneType === STONE_TYPES.builtin) {
        if (Util.versions.canIUse(stone.config.firmwareVersion, '2.1.0')) {
          items.push({
            label: lang("Enable_Switchcraft"),
            type: 'switch',
            experimental: true, hasHelp: true, onHelp: () => {
              Actions.switchCraftInformation()
            },
            icon: <IconButton name="md-power" size={22} button={true} color="#fff"
                              buttonStyle={{backgroundColor: colors.purple.hex}}/>,
            value: this.state.switchCraft === true,
            callback: (newValue) => {
              this.setState({switchCraft: newValue});
            }
          });
          items.push({
            label: lang("Use_modified_wall_switche"),
            type: 'explanation',
            below: true
          });
        }
        else {
          items.push({label: lang("SWITCHCRAFT"), type: 'explanation', below: false, alreadyPadded: true});
          items.push({
            label: lang("Firmware_update_required_"),
            type: 'disabledInfo',
            icon: <IconButton name="md-power" size={22} button={true} color="#fff"
                              buttonStyle={{backgroundColor: colors.purple.hex}}/>,
          });
          items.push({
            label: lang("Use_modified_wall_switches"),
            type: 'explanation',
            below: true
          });
        }
      }
    }
    else {
      items.push({type: 'spacer'});
    }


    if (hasAppliance) {
      items.push({label: lang("SELECT_WHICH_DEVICE_TYPE_"), type: 'explanation', below: false, style:{paddingTop:0}});
      items.push({
        label: lang("Select___"), type: 'navigation', labelStyle: {color: colors.blue.hex}, callback: () => {
          Actions.applianceSelection({
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            applianceId: this.state.applianceId,
            callback: (applianceId) => {
              this.setState({showStone:false, applianceId: applianceId});
            }
          });
        }
      });
      items.push({
        label: lang("A_Device_Type_has_it_s_ow"),
        type: 'explanation',
        below: true
      });
    }

    if (Permissions.inSphere(this.props.sphereId).removeCrownstone) {
      items.push({
        label: lang("Remove_from_Sphere"),
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          Alert.alert(
lang("_Are_you_sure___Removing__header"),
lang("_Are_you_sure___Removing__body"),
[{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: () => {
              if (stone.reachability.disabled === true) {
                Alert.alert("Can't see this one!",
                  "This Crownstone has not been seen for a while.. Can you move closer to it and try again? If you want to remove it from your Sphere without resetting it, press Delete anyway.",
                  [{text:lang("Delete_anyway"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
                    {text:'Cancel',style: 'cancel', onPress: () => {this.props.eventBus.emit('hideLoading');}}]
                )
              }
              else {
                this.props.eventBus.emit('showLoading', 'Looking for the Crownstone...');
                this._removeCrownstone(stone).catch((err) => {});
              }
            }}]
          )
        }
      });
      items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});
    }

    return items;
  }


  _removeCrownstone(stone) {
    return new Promise((resolve, reject) => {
      BleUtil.detectCrownstone(stone.config.handle)
        .then((isInSetupMode) => {
          // if this crownstone is broadcasting but in setup mode, we only remove it from the cloud.
          if (isInSetupMode === true) {
            this._removeCloudOnly();
          }
          this._removeCloudReset(stone);
        })
        .catch((err) => {
          Alert.alert(
lang("_Cant_see_this_one___We_c_header"),
lang("_Cant_see_this_one___We_c_body"),
[{text:lang("_Cant_see_this_one___We_c_left"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
              {
text:lang("_Cant_see_this_one___We_c_right"),style:  lang("cancel"), onPress: () => {this.props.eventBus.emit('hideLoading');}}])
        })
    })
  }


  _removeCloudOnly() {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise((resolve, reject) => {
          if (err && err.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err);
            reject();
          }
        })
      })
      .then(() => {
        this._removeCrownstoneFromRedux(false);
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err);
        this.props.eventBus.emit('hideLoading');
        Alert.alert(
lang("_Encountered_Cloud_Issue__header"),
lang("_Encountered_Cloud_Issue__body"),
[{text:lang("_Encountered_Cloud_Issue__left")}])
      })
  }


  _removeCloudReset(stone) {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise((resolve, reject) => {
          if (err && err.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err);
            reject();
          }
        })
      })
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Factory resetting the Crownstone...');
        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:"commandFactoryReset"}, {}, 5, "Factory reset from deviceEdit.")
          .then(() => {
            this._removeCrownstoneFromRedux(true);
          })
          .catch((err) => {
            LOGe.info("ERROR:",err);
            Alert.alert(
lang("_Encountered_a_problem____header"),
lang("_Encountered_a_problem____body"),
[{text:lang("_Encountered_a_problem____left"), onPress: () => {
                this.props.eventBus.emit('hideLoading');
                BackAction('roomOverview');
              }}]
            )
          })

        BatchCommandHandler.executePriority();

      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err);
        Alert.alert(
lang("_Encountered_Cloud_Issue___header"),
lang("_Encountered_Cloud_Issue___body"),
[{text:lang("_Encountered_Cloud_Issue___left"), onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }


  _removeCrownstoneFromRedux(factoryReset = false) {
    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    let labelText =  lang("I_have_removed_this_Crown");
    if (factoryReset === false) {
     labelText =  lang("I_have_removed_this_Crowns")}

    Alert.alert(
lang("_Success__arguments___OKn_header"),
lang("_Success__arguments___OKn_body",labelText),
[{text:lang("_Success__arguments___OKn_left"), onPress: () => {
        this.props.eventBus.emit('hideLoading');
        BackAction('roomOverview');
        this.props.store.dispatch({type: "REMOVE_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }}]
    )
  }


  _updateCrownstone() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    let appliance = null;
    if (stone.config.applianceId) {
      appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
    }

    // collect promises to handle changes in switchcraft and dim state
    let changePromises = [];
    let dimChange         = this._setDimState(stone);
    let switchCraftChange = this._setSwitchcraftState(stone);
    if (dimChange)         { changePromises.push(dimChange); }
    if (switchCraftChange) { changePromises.push(switchCraftChange); }
    Promise.all(changePromises)
      .then(() => { this.props.eventBus.emit("hideLoading"); } )
      .catch((err) => { () => { this.props.eventBus.emit("hideLoading"); } });

    let actions = [];
    if (
      stone.config.name           !== this.state.stoneName      ||
      stone.config.icon           !== this.state.stoneIcon      ||
      stone.config.tapToToggle    !== this.state.tapToToggle    ||
      stone.config.applianceId    !== this.state.applianceId
    ) {
      actions.push({
        type:'UPDATE_STONE_CONFIG',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: {
          name: this.state.stoneName,
          icon: this.state.stoneIcon,
          tapToToggle: this.state.tapToToggle,
          applianceId: this.state.applianceId,
        }});
    }

    if (appliance && this.state.applianceId && (
        appliance.config.name  !== this.state.applianceName ||
        appliance.config.icon  !== this.state.applianceIcon
      )) {
      actions.push({
        type:'UPDATE_APPLIANCE_CONFIG',
        sphereId: this.props.sphereId,
        applianceId: this.state.applianceId,
        data: {
          name: this.state.applianceName,
          icon: this.state.applianceIcon,
        }});
    }

    if (actions.length > 0) {
      this.props.store.batchDispatch(actions);
    }

    BackAction();
  }

  _setDimState(stone) {
    if (stone.config.dimmingEnabled !== this.state.dimmingEnabled) {
      if (stone.config.locked) {
        Alert.alert(
lang("_Crownstone_Locked__You_h_header"),
lang("_Crownstone_Locked__You_h_body",this.state.dimmingEnabled),
[{text:lang("_Crownstone_Locked__You_h_left")}]);
        return;
      }
      if (stone.reachability.disabled) {
        Alert.alert(
lang("_Cant_see_this_Crownstone_header"),
lang("_Cant_see_this_Crownstone_body",this.state.dimmingEnabled),
[{text:lang("_Cant_see_this_Crownstone_left")}]);
        return;
      }

      let promises = [];
      let dimmingChangedSuccessfully = false;
      if (this.state.dimmingEnabled === false) {
        this.props.eventBus.emit("showLoading", "Disabling dimming on this Crownstone...");
        // turn the relay on if dimming is being disabled and the stone is dimming
        if (stone.state.state > 0) {
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName: 'multiSwitch', state: 1, intent: INTENTS.manual, timeout: 0}));
        }
        promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName: 'allowDimming', value: false })
          .then(() => { dimmingChangedSuccessfully = true; })
          .catch((err) => {
            LOGe.info("DeviceEdit: Could not disable dimming on Crownstone", err);
            Alert.alert(
lang("_Im_sorry_____I_couldnt_d_header"),
lang("_Im_sorry_____I_couldnt_d_body"),
[{text:lang("_Im_sorry_____I_couldnt_d_left")}])
          }));
      }
      else {
        this.props.eventBus.emit("showLoading", "Enabling dimming on this Crownstone...");
        promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName: 'allowDimming', value: true })
          .then(() => { dimmingChangedSuccessfully = true; })
          .catch((err) => {
            LOGe.info("DeviceEdit: Could not enable dimming on Crownstone", err);
            Alert.alert(
lang("_Im_sorry_____I_couldnt_e_header"),
lang("_Im_sorry_____I_couldnt_e_body"),
[{text:lang("_Im_sorry_____I_couldnt_e_left")}])
          }));
      }
      BatchCommandHandler.executePriority();
      return Promise.all(promises).then(() => {
        if (dimmingChangedSuccessfully) {
          this.props.store.dispatch({
            type: 'UPDATE_STONE_CONFIG',
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            data: {
              dimmingEnabled: this.state.dimmingEnabled,
            }
          });
        }
      });
    }
  }

  _setSwitchcraftState(stone) {
    if (stone.config.switchCraft !== this.state.switchCraft) {
      this.props.eventBus.emit("showLoading", "Configuring Switchcraft on this Crownstone...");

      if (stone.reachability.disabled) {
        Alert.alert(
lang("_Cant_see_this_Crownstone__header"),
lang("_Cant_see_this_Crownstone__body",this.state.dimmingEnabled),
[{text:lang("_Cant_see_this_Crownstone__left")}]);
        return;
      }

      let changePromise = BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName: 'setSwitchCraft', value: this.state.switchCraft })
        .then(() => {
          this.props.store.dispatch({
            type: 'UPDATE_STONE_CONFIG',
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            data: {
              dimmingEnabled: this.state.dimmingEnabled,
            }
          });
        })
        .catch((err) => {
          LOGe.info("DeviceEdit: Could not configure Switchcraft on Crownstone", this.state.switchCraft, err);
          Alert.alert(
lang("_Im_sorry_____I_couldnt_c_header"),
lang("_Im_sorry_____I_couldnt_c_body"),
[{text:lang("_Im_sorry_____I_couldnt_c_left")}])
        });
      BatchCommandHandler.executePriority();
      return changePromise;
    }
  }


  _getVersionInformation(stone) {
    let unknownString = "Not checked.";

    if (this.state.refreshingStoneVersions) {
      return (
        <View style={{paddingTop:15, paddingBottom:30}}>
          <Text style={[styles.version,{paddingBottom:4}]}>{ lang("Checking_versions____") }</Text>
          <ActivityIndicator animating={true} size='small' color={colors.darkGray2.hex} />
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity style={{paddingTop:15, paddingBottom:30}} onPress={() => {
          if (stone.reachability.disabled) {
            return Alert.alert(
lang("_Cant_see_this_stone___I__header"),
lang("_Cant_see_this_stone___I__body"),
[{text:lang("_Cant_see_this_stone___I__left")}]);
          }

          this.setState({refreshingStoneVersions: true});
          let promises = [];
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getFirmwareVersion'},{},2, 'from checkFirmware')
            .then((firmwareVersion : {data: string}) => {
              this.props.store.dispatch({
                type: "UPDATE_STONE_CONFIG",
                stoneId: this.props.stoneId,
                sphereId: this.props.sphereId,
                data: {
                  firmwareVersion: firmwareVersion.data,
                }
              })
              .catch((err) => {
                Alert.alert(
lang("_Whoops___I_could_not_get_header"),
lang("_Whoops___I_could_not_get_body"),
[{text:lang("_Whoops___I_could_not_get_left")}]);
                throw err;
              });
            }));
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getHardwareVersion'},{},2, 'from checkFirmware')
            .then((hardwareVersion : {data: string}) => {
              this.props.store.dispatch({
                type: "UPDATE_STONE_CONFIG",
                stoneId: this.props.stoneId,
                sphereId: this.props.sphereId,
                data: {
                  hardwareVersion: hardwareVersion.data,
                }
              })
              .catch((err) => {
                Alert.alert(
lang("_Whoops___I_could_not_get__header"),
lang("_Whoops___I_could_not_get__body"),
[{text:lang("_Whoops___I_could_not_get__left")}]);
                throw err;
              });
            }));
          BatchCommandHandler.executePriority();
          
          
          Promise.all(promises)
            .then(() => {
              this.setState({refreshingStoneVersions: false});
            })
            .catch((err) => {
              this.setState({refreshingStoneVersions: false});
            });
        }}>
          <Text style={styles.version}>{ lang("address__",stone.config.macAddress,unknownString) }</Text>
          <Text style={styles.version}>{ lang("hardware_id__",stone.config.hardwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("bootloader__",stone.config.bootloaderVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("firmware__",stone.config.firmwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("crownstone_id__",stone.config.crownstoneId,unknownString) }</Text>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const state = this.props.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted /> }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return <StoneDeleted /> }

    let options = this.constructStoneOptions(stone, state);

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    return (
      <Background hasNavBar={false} image={backgroundImage}>
        <OrangeLine />
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          {this._getVersionInformation(stone)}
        </ScrollView>
      </Background>
    )
  }
}
