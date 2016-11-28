import React, { Component } from 'react'
import {
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { stoneTypes } from '../../router/store/reducers/stones'
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { BleActions } from '../../native/Proxy'
import { BleUtil } from '../../native/BleUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { FadeInView } from '../components/animated/FadeInView'
import { LOG } from '../../logging/Log'



export class DeviceEdit extends Component {
  constructor() {
    super();
    this.state = {showStone:false};
    this.deleting = false;
  }

  componentDidMount() {
    const { store } = this.props;
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        Actions.pop();
        return;
      }

      if ( change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId] ) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  addDeleteOptions(items, stone) {
    items.push({
      label: 'Remove from Sphere',
      icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      type: 'button',
      callback: () => {
        Alert.alert(
          "Are you sure?",
          "Removing a Crownstone from the sphere will revert it to it's factory default settings.",
          [{text: 'Cancel'}, {text: 'Remove', onPress: () => {
            this.props.eventBus.emit('showLoading', 'Looking for the Crownstone...');
            this._removeCrownstone(stone);
          }}]
        )
      }
    });
    items.push({label:'Removing this Crownstone from its Sphere will reset it back to factory defaults.',  type:'explanation', below:true});

    return items;
  }

  constructStoneOptions(store, stone) {
    let requiredData = {
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
    };
    let items = [];

    items.push({label:'CROWNSTONE', type: 'explanation',  below:false});
    items.push({
      label: 'Name', type: 'textEdit', placeholder:'Choose a nice name', value: stone.config.name, callback: (newText) => {
        store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {name: newText}});
      }
    });

    if (stone.config.type !== stoneTypes.guidestone) {
      items.push({label: 'PLUGGED IN DEVICE', type: 'explanation', below: false});
      items.push({
        label: 'Select...', type: 'navigation', labelStyle: {color: colors.blue.hex}, callback: () => {
          Actions.applianceSelection({
            ...requiredData,
            callback: (applianceId) => {
              this.setState({showStone:false});
              store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {applianceId: applianceId}});
            }
          });
        }
      });
      items.push({
        label: 'A Device has it\'s own configuration so you can set up once and quickly apply it to a Crownstone.',
        type: 'explanation',
        below: true
      });
    }
    else {
      items.push({type:'spacer'});
    }

    items = this.addDeleteOptions(items, stone);

    return items;
  }


  constructApplianceOptions(store, appliance, applianceId, stone) {
    let requiredData = {
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      applianceId: applianceId
    };
    let items = [];

    // let toSchedule  = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};
    // let toLinkedDevices = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};

    items.push({label:'PLUGGED IN DEVICE', type: 'explanation',  below:false});
    items.push({
      label: 'Device Name', type: 'textEdit', placeholder:'Choose a nice name', value: appliance.config.name, callback: (newText) => {
        store.dispatch({...requiredData, type: 'UPDATE_APPLIANCE_CONFIG', data: {name: newText}});
      }
    });

    // icon picker
    items.push({label:'Icon', type: 'icon', value: appliance.config.icon, callback: () => {
      Actions.deviceIconSelection({applianceId: applianceId, stoneId: this.props.stoneId, icon: appliance.config.icon, sphereId: this.props.sphereId})
    }});

    // unplug device
    items.push({
      label: 'Unplug Device', type: 'button', style: {color: colors.blue.hex}, callback: () => {
        this.setState({showStone:true});
        setTimeout(() => {store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {applianceId: null}});}, 300);
      }
    });
    items.push({label:'Unplugging will revert the behaviour back to the empty Crownstone configuration.', type: 'explanation',  below:true});

    // // dimmable
    // items.push({label:'Dimmable', type: 'switch', value:device.config.dimmable, callback: (newValue) => {
    //     store.dispatch({...requiredData, type:'UPDATE_STONE_CONFIG', data:{dimmable:newValue}});
    // }});

    items = this.addDeleteOptions(items, stone);

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
            [{text:'Delete anyway', onPress: () => {this._removeCloudOnly()}},
              {text:'OK', onPress: () => {this.props.eventBus.emit('hideLoading');}}])
        })
    })
  }


  _removeCloudOnly() {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .then(() => {
        this._removeCrownstoneFromRedux(false);
      })
      .catch((err) => {
        LOG("error while asking the cloud to remove this crownstone", err);
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Crownstone in the cloud. Please try again later",
          [{text:'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }

  _removeCloudReset(stone) {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Factory resetting the Crownstone...');
        let proxy = BleUtil.getProxy(stone.config.handle);
        proxy.perform(BleActions.commandFactoryReset)
          .then(() => {
            this._removeCrownstoneFromRedux(true);
          })
          .catch((err) => {
            LOG("ERROR:",err);
            Alert.alert("Encountered a problem.",
              "We cannot Factory reset this Crownstone. Unfortunately, it has already been removed from the cloud. " +
              "You can recover it using the recovery procedure.",
              [{text:'OK', onPress: () => {
                this.props.eventBus.emit('hideLoading');
                Actions.pop();
                Actions.settingsPluginRecoverStep1();
              }}]
            )
          })
      })
      .catch((err) => {
        LOG("error while asking the cloud to remove this crownstone", err);
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
     labelText = "I have removed this Crownstone from the Cloud and your Sphere. I could not reset it back to setup mode thought.. You'll need to recover it to put it back into setup mode."
    }

    // revert to the previous screen is done by the store listener in componentDidMount
    Alert.alert("Success!", labelText,
      [{text:'OK', onPress: () => {
        this.props.eventBus.emit('hideLoading');
        this.props.store.dispatch({type: "REMOVE_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }}]
    )
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const stone   = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let applianceOptions = [];
    let stoneOptions = this.constructStoneOptions(store, stone);
    if (stone.config.applianceId) {
      let appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      applianceOptions = this.constructApplianceOptions(store, appliance, stone.config.applianceId, stone);
    }

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    return (
      <Background image={backgroundImage} >
        <ScrollView>
          <View style={{height:screenHeight}}>
            <FadeInView visible={!this.state.showStone} style={{position:'absolute', top:0, left:0, width: screenWidth}} duration={300}>
              <ListEditableItems items={applianceOptions} separatorIndent={true}/>
            </FadeInView>
            <FadeInView visible={this.state.showStone || applianceOptions.length == 0} style={{position:'absolute', top:0, left:0, width:screenWidth}} duration={300}>
              <ListEditableItems items={stoneOptions} separatorIndent={false}/>
            </FadeInView>
          </View>
        </ScrollView>
      </Background>
    )
  }
}
