import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Linking,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {styles, colors, OrangeLine} from '../styles'
import { SettingConstructor } from '../../util/SettingConstructor'

import DeviceInfo from 'react-native-device-info';
import { core } from "../../core";

export class SettingsOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Settings"),
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  unsubscribe : any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
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
    const store = core.store;
    const state = store.getState();
    let items = SettingConstructor(store, state, core.eventBus);

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
            <Text style={{fontSize:12, color:'#444'}}>{ lang("Crownstone_") }</Text>
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/terms-of-service/').catch(err => {})}}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>{ lang("terms_") }</Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>{ lang("__") }</Text>
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {}) }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>{ lang("privacy_policy") }</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

    return items;
  }

  render() {
    return (
      <Background image={core.background.menu}>
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
          <Text style={[styles.version,{paddingBottom: 20}]}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
        </ScrollView>
      </Background>
    );
  }
}
