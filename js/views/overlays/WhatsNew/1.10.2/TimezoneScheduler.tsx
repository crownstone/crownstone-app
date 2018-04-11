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


export class TimezoneScheduler extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Schedules now support daylight saving time and timezones.</Text>
            <View style={{height:30}} />
            <Text style={WNStyles.important}>IMPORTANT: ALL EXISTING SCHEDULES NEED TO BE SYNCED UPDATED.</Text>
            <Image source={require('../../../../images/whatsNew/1.10.2/timezoneSchedule.png')} style={{width:544*size, height:750*size}} />
            <Text style={WNStyles.detail}>
              Because the time sent to the Crownstone has changed,
              the existing schedules will fire a the wrong time.
              Sync, then change the time to fix it!</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


