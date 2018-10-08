import { Languages } from "../../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class SyncingSchedules extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ Languages.text("SyncingSchedules", "You_can_now_download_the_")() }</Text>
            <View style={{height:15}} />
            <Text style={WNStyles.important}>{ Languages.text("SyncingSchedules", "IMPORTANT__ALL_EXISTING_S")() }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.2/syncScheduler.png')} style={{width:602*size, height:821*size}} />
            <Text style={WNStyles.detail}>{ Languages.text("SyncingSchedules", "Use_this_to_change_or_del")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


