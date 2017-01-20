import React, { Component } from 'react'
import {
  Alert,
  Dimensions,
  Linking,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { userHasPlugsInSphere, getPresentSphere } from './../../util/dataUtil'
import { logOut } from './../../util/util'
import { CLOUD } from './../../cloud/cloudAPI'
import { Background } from './../components/Background'
import { TopBar } from './../components/Topbar'
import { ListEditableItems } from './../components/ListEditableItems'
import { Actions } from 'react-native-router-flux';
import { styles, colors } from './../styles'
import { IconButton } from '../components/IconButton'


export class SettingsOverview extends Component {

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let items = [];

    items.push({type:'explanation', label:'UPDATE YOUR PROFILE', below:false});
    items.push({label:'My Profile', icon: <IconButton name="ios-body" size={23} button={true} color="#fff" buttonStyle={{backgroundColor:colors.purple.hex}} />, type:'navigation', callback: () => {Actions.settingsProfile()}});

    items.push({type:'explanation', label:'CONFIGURATION', below:false});
    if (Object.keys(state.spheres).length > 0) {
      items.push({label:'Spheres', icon: <IconButton name="c1-house" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, type:'navigation', callback: () => {
        Actions.settingsSphereOverview()
      }});
    }
    else {
      items.push({label:'Add Sphere', icon: <IconButton name="c1-house" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, type:'navigation', callback: () => {
        this.props.eventBus.emit('showLoading', 'Creating Sphere...');
        CLOUD.createNewSphere(store, state.user.firstName, this.props.eventBus)
          .then((sphereId) => {
            this.props.eventBus.emit('hideLoading');
            let state = this.props.store.getState();
            let title = state.spheres[sphereId].config.name;
            Actions.settingsSphere({sphereId: sphereId, title: title})
          })
          .catch(() => {this.props.eventBus.emit('hideLoading');});
      }});
    }

    let presentSphere = getPresentSphere(state);
    if (presentSphere && userHasPlugsInSphere(state, presentSphere)) {
      items.push({
        label:'Calibrate Tap-to-Toggle',
        type:'button',
        style: {color:'#000'},
        icon: <IconButton name="md-flask" size={22} button={true} style={{position:'relative', top:1}} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
        callback: () => {this.props.eventBus.emit("CalibrateTapToToggle", {canClose: true, tutorial: false});}
      });

    }


    items.push({label:'TROUBLESHOOTING',  type:'explanation', below: false});
    items.push({label:'Help', type:'navigation', icon: <IconButton name="ios-help-circle" size={22} button={true} style={{position:'relative', top:1}} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />, callback: () => { Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {})}});
    items.push({
      label: 'Recover a Crownstone',
      icon: <IconButton name="c1-socket2" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.menuTextSelected.hex}} />,
      type: 'navigation',
      callback: () => {
        Actions.settingsPluginRecoverStep1();
      }
    });
    items.push({label:'If you want to reset a Crownstone because it is not responding correctly, recover it!',  type:'explanation', below: true});

    items.push({label:'Log Out', type:'button', icon: <IconButton name="md-log-out" size={22} button={true} style={{position:'relative', top:1}} color="#fff" buttonStyle={{backgroundColor:colors.menuRed.hex}} />, callback: () => {this._logoutPopup()}});

    items.push({type:'spacer'});
    items.push({type:'explanation',
    __item: (
      <View style={{flex:1}} />
    )});
    items.push({
      type: 'explanation',
      __item: (
        <View style={{backgroundColor:'transparent'}}>
          <View style={{flexDirection:'row', padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12, justifyContent:'center'}}>
            <Text style={{fontSize:12, color:'#444'}}>Crownstone </Text>
            <TouchableHighlight onPress={() => {
              Linking.openURL('https://crownstone.rocks/terms-of-service/').catch(err => {})
            }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>terms </Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>& </Text>
            <TouchableHighlight onPress={() => {
              Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {})
            }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>privacy policy</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

    return items;
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: () => {logOut()}}
    ])
  }

  render() {
    return (
      <Background hideTopBar={true} image={this.props.backgrounds.menu} >
        <TopBar
          title={"Settings"}
          notBack={true}
        />
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}

// TODO: restore once we have a better description for this. Also Location must be working.
// if (totalAmountOfCrownstones > 0) {
//   items.push({type: 'explanation', label: 'USE LOCALIZATION', below: false});
//   items.push({
//     type: 'switch', label: 'Enable Localization', value: state.app.enableLocalization,
//     callback: (newValue) => {
//       store.dispatch({
//         type: 'UPDATE_APP_STATE',
//         data: {enableLocalization: newValue}
//       })
//       NativeEventsBridge.stopListeningToLocationEvents();
//       if (newValue === true) {
//         NativeEventsBridge.startListeningToLocationEvents();
//       }
//       this.forceUpdate();
//     }
//   });
// }
// TODO: restore once we have a better description for this. Also mesh must be working.
// if (state.app.activeSphere && Object.keys(state.spheres[state.app.activeSphere].stones).length > 0) {
//   items.push({type: 'spacer'});
//   items.push({
//     type: 'button',
//     label: 'Turn all Crownstones on',
//     icon: <IconButton name="ios-power" size={22} button={true} style={{position: 'relative', top: 1}} color="#fff"
//                       buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
//     style: {color: colors.menuTextSelected.hex},
//     callback: () => {
//       Alert.alert("Are you sure?", "Are you sure you want to turn on every Crownstone in this Sphere?", [
//         {text: 'Cancel', style: 'cancel'},
//         {text: 'OK', onPress: () => {}}
//       ])
//     }
//   });
// }