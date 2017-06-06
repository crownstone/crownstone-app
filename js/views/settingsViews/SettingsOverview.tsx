import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { TopBar } from '../components/Topbar'
import { ListEditableItems } from '../components/ListEditableItems'
import { Actions } from 'react-native-router-flux';
import { styles, colors } from '../styles'
import { SettingConstructor } from '../../util/SettingConstructor'

const DeviceInfo = require('react-native-device-info');

export class SettingsOverview extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeSpheres || change.changeStones) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let items = SettingConstructor(store, state, this.props.eventBus);

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
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/terms-of-service/').catch(err => {})}}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>terms </Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>{"& "}</Text>
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {}) }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>privacy policy</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

    return items;
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
          <Text style={styles.version}>{'version: ' + DeviceInfo.getReadableVersion()}</Text>
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