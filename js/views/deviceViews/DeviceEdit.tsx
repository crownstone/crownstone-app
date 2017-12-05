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
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { BluenetPromiseWrapper } from '../../native/libInterface/BluenetPromise'
import { BleUtil } from '../../util/BleUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { FadeInView } from '../components/animated/FadeInView'
import { LOG } from '../../logging/Log'
import {DIMMING_ENABLED} from "../../ExternalConfig";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Util} from "../../util/Util";
import {TopBar} from "../components/Topbar";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {StoneUtil} from "../../util/StoneUtil";
import { INTENTS } from "../../native/libInterface/Constants";
import {BackAction} from "../../util/Back";


export class DeviceEdit extends Component<any, any> {
  deleting : boolean = false;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const store = props.store;
    const state = store.getState();
    const stone = state.spheres[props.sphereId].stones[props.stoneId];
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

      dimmingEnabled: stone.config.dimmingEnabled,
      tapToToggle: stone.config.tapToToggle,

      showStone: false,

      gettingFirmwareVersion: false
    };
  }

  componentDidMount() {
    const { store } = this.props;

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = store.getState();

      // in case the sphere is deleted
      if (state.spheres[this.props.sphereId] === undefined) {
        BackAction();
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

    if (this.state.applianceId) {
      items.push({label:'PLUGGED IN DEVICE TYPE', type: 'explanation',  below:false});
      items.push({
        label: 'Device Type',
        type: 'textEdit',
        placeholder:'Pick a name',
        value: this.state.applianceName,
        callback: (newText) => {
          this.setState({applianceName: newText});
        }
      });

      // icon picker
      items.push({
        label:'Icon',
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
        label: 'Decouple Device Type',
        type: 'button',
        icon: <IconButton name="c1-socket2" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        style: {color: colors.blue.hex},
        callback: () => {
          this.setState({showStone:true, applianceId: null});
        }
      });
      items.push({label:'This Crownstone is currently using the behaviour, name and icon of this device type. Decoupling it will revert the behaviour back to the empty Crownstone configuration.', type: 'explanation',  below:true});

      items.push({label: 'CURRENT CROWNSTONE USING THIS TYPE', type: 'explanation', below: false});
    }
    else {
      items.push({label: 'CROWNSTONE', type: 'explanation', below: false});
    }

    items.push({
      label: 'Name',
      type: 'textEdit',
      placeholder:'Pick a name',
      value: this.state.stoneName,
      callback: (newText) => {
        this.setState({stoneName: newText})
      }
    });

    if (DIMMING_ENABLED) {
      if (Util.versions.isHigherOrEqual(stone.config.firmwareVersion, '1.7.0')) {
        items.push({
          label: 'Allow Dimming', type: 'switch', value: this.state.dimmingEnabled === true, callback: (newValue) => {
            this.setState({dimmingEnabled: newValue});
          }
        });
      }
      else {
        items.push({ label: 'Firmware update required for dimming.', type: 'disabledInfo'});
      }

      items.push({
        label: 'View Dimming Compatibility', type: 'navigation', callback: () => {
          Linking.openURL('https://crownstone.rocks/compatibility/dimming/').catch(() => {})
        }
      });
      items.push({
        label: 'Dimming can be enabled per Crownstone. It is up to you to make sure you are not dimming anything other than lights. To do so is at your own risk.',
        type: 'explanation',
        below: true
      });
    }


    if (state.app.tapToToggleEnabled) {
      items.push({
        label: 'Tap to toggle', type: 'switch', value: this.state.tapToToggle === true, callback: (newValue) => {
          this.setState({tapToToggle: newValue});
        }
      });

      items.push({
        label: 'Tap to toggle can be enabled per Crownstone.',
        type: 'explanation',
        below: true
      });
    }
    else {
      items.push({ label: 'Tap to toggle is disabled.', type: 'disabledInfo'});
      items.push({
        label: 'To use tap to toggle, you have to enable it globally in the app settings.',
        type: 'explanation',
        below: true
      });
    }


    if (stone.config.type !== STONE_TYPES.guidestone && !this.state.applianceId) {
      items.push({label: 'SELECT WHICH DEVICE TYPE IS PLUGGED IN', type: 'explanation', below: false});
      items.push({
        label: 'Select...', type: 'navigation', labelStyle: {color: colors.blue.hex}, callback: () => {
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
        label: 'A Device Type has it\'s own configuration and behaviour so you can set up once and quickly apply it to one or multiple Crownstones.',
        type: 'explanation',
        below: true
      });
    }

    if (Permissions.inSphere(this.props.sphereId).removeCrownstone) {
      items.push({
        label: 'Remove from Sphere',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          Alert.alert(
            "Are you sure?",
            "Removing a Crownstone from the sphere will revert it to it's factory default settings.",
            [{text: 'Cancel', style: 'cancel'}, {text: 'Remove', style:'destructive', onPress: () => {
              if (stone.config.disabled === true) {
                Alert.alert("Can't see this one!",
                  "This Crownstone has not been seen for a while.. Can you move closer to it and try again? If you want to remove it from your Sphere without resetting it, press Delete anyway.",
                  [{text:'Delete anyway', onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
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
      items.push({label:'Removing this Crownstone from its Sphere will revert it back to factory defaults (and back in setup mode).',  type:'explanation', below:true});
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
          Alert.alert("Can't see this one!",
            "We can't find this Crownstone while scanning. Can you move closer to it and try again? If you want to remove it from your Sphere without resetting it, press Delete anyway.",
            [{text:'Delete anyway', onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
              {text:'Cancel',style: 'cancel', onPress: () => {this.props.eventBus.emit('hideLoading');}}])
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
            LOG.error("COULD NOT DELETE IN CLOUD", err);
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
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Crownstone in the cloud. Please try again later",
          [{text:'OK'}])
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
            LOG.error("COULD NOT DELETE IN CLOUD", err);
            reject();
          }
        })
      })
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Factory resetting the Crownstone...');
        let proxy = BleUtil.getProxy(stone.config.handle);
        proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
          .catch(() => {
            // second attempt
            return proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
          })
          .then(() => {
            this._removeCrownstoneFromRedux(true);
          })
          .catch((err) => {
            LOG.error("ERROR:",err);
            Alert.alert("Encountered a problem.",
              "We cannot Factory reset this Crownstone. Unfortunately, it has already been removed from the cloud. " +
              "Try deleting it again or use the recovery procedure to put it in setup mode.",
              [{text:'OK', onPress: () => {
                this.props.eventBus.emit('hideLoading');
                BackAction();
              }}]
            )
          })
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err);
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Crownstone in the cloud. Please try again later",
          [{text:'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }


  _removeCrownstoneFromRedux(factoryReset = false) {
    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    let labelText = "I have removed this Crownstone from the Cloud, your Sphere and reverted it to factory defaults. After plugging it in and out once more, you can freely add it to a Sphere.";
    if (factoryReset === false) {
     labelText = "I have removed this Crownstone from the Cloud and your Sphere. I could not reset it back to setup mode though.. You'll need to recover it to put it back into setup mode."
    }

    Alert.alert("Success!", labelText,
      [{text:'OK', onPress: () => {
        this.props.eventBus.emit('hideLoading');
        BackAction();
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

    // turn the stone off if dimming is being disabled
    if (stone.config.dimmingEnabled !== this.state.dimmingEnabled && this.state.dimmingEnabled === false) {
      StoneUtil.switchBHC(
        this.props.sphereId,
        this.props.stoneId,
        stone,
        0,
        this.props.store,
        {},
        (err) => {},
        INTENTS.manual,
        10,
        'from disabling dimming'
      );
    }

    let actions = [];
    if (
      stone.config.name           !== this.state.stoneName ||
      stone.config.icon           !== this.state.stoneIcon ||
      stone.config.dimmingEnabled !== this.state.dimmingEnabled ||
      stone.config.tapToToggle    !== this.state.tapToToggle ||
      stone.config.applianceId    !== this.state.applianceId
    ) {
      actions.push({
        type:'UPDATE_STONE_CONFIG',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: {
          name: this.state.stoneName,
          icon: this.state.stoneIcon,
          dimmingEnabled: this.state.dimmingEnabled,
          tapToToggle: this.state.tapToToggle,
          applianceId: this.state.applianceId,
        }});
    }

    if (appliance && this.state.applianceId && (
        appliance.config.name           !== this.state.applianceName ||
        appliance.config.icon           !== this.state.applianceIcon
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


  _getVersionInformation(stone) {
    let unknownString = "Not checked.";

    if (this.state.gettingFirmwareVersion) {
      return (
        <View style={{paddingTop:15, paddingBottom:30}}>
          <Text style={[styles.version,{paddingBottom:4}]}>{'Checking firmware version... '}</Text>
          <ActivityIndicator animating={true} size='small' color={colors.darkGray2.hex} />
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity style={{paddingTop:15, paddingBottom:30}} onPress={() => {
          if (stone.config.disabled) {
            return Alert.alert("Can't see this stone!", "I have to be in range to get the firwmare version of this Crownstone.", [{text:'OK'}]);
          }

          this.setState({gettingFirmwareVersion: true});
          BatchCommandHandler.load(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getFirmwareVersion'},{},1, 'from checkFirmware in DeviceEdit')
            .then((firmwareVersion) => {
              this.setState({gettingFirmwareVersion: false});
              this.props.store.dispatch({
                type: "UPDATE_STONE_CONFIG",
                stoneId: this.props.stoneId,
                sphereId: this.props.sphereId,
                data: {
                  firmwareVersion: firmwareVersion, //firmwareVersion,
                }
              });
            })
            .catch((err) => {
              Alert.alert("Whoops!", "I could not get the firmware version....", [{text:'OK'}]);
              this.setState({gettingFirmwareVersion: false});
            });
          BatchCommandHandler.executePriority();
        }}>
          <Text style={styles.version}>{'address: '     + (stone.config.macAddress || unknownString)}</Text>
          <Text style={styles.version}>{'hardware id: ' + (stone.config.hardwareVersion || unknownString)}</Text>
          <Text style={styles.version}>{'bootloader: '  + (stone.config.bootloaderVersion || unknownString)}</Text>
          <Text style={styles.version}>{'firmware: '    + (stone.config.firmwareVersion || unknownString)}</Text>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let options = this.constructStoneOptions(stone, state);

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    return (
      <Background hideInterface={true} image={backgroundImage}>
        <TopBar
          notBack={true}
          left={'Cancel'}
          leftStyle={{color:colors.white.hex, fontWeight: 'bold'}}
          leftAction={ Actions.pop }
          right={'Save'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={ () => { this._updateCrownstone(); }}
          title="Edit Device"
        />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width: screenWidth}} />
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          {this._getVersionInformation(stone)}
        </ScrollView>
      </Background>
    )
  }
}
