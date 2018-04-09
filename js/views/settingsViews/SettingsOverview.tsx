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
import {styles, colors, screenWidth} from '../styles'
import { SettingConstructor } from '../../util/SettingConstructor'

const DeviceInfo = require('react-native-device-info');

export class SettingsOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Settings",
    }
  };

  unsubscribe : any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeSpheres || change.changeStones || change.changeAppSettings || change.changeUserDeveloperStatus) {
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
      <Background image={this.props.backgrounds.menu}>
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
          <Text style={[styles.version,{paddingBottom: 20}]}>{'version: ' + DeviceInfo.getReadableVersion()}</Text>
        </ScrollView>
      </Background>
    );
  }
}
