import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {availableScreenHeight, screenWidth} from "../../../styles";
import {WNStyles} from "./WhatsNew";


export class NewScheduler extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:45, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>You can tell the Crownstone to do something at a certain time!</Text>
            <Image source={require('../../../../images/whatsNew/scheduler.png')} style={{width:556*size, height:820*size}}/>
            <Text style={WNStyles.detail}>{
              "In order to be use the scheduler, the Crownstone will need to update it's firmware first. " +
              "The new firmware should also be available now!" +
              "\n\nWhen the update is available, the Crownstones in your room will show an up arrow. Press it to start the update process." +
              "\n\nIf you do not see it right away, check back later to see if the update is available!"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


