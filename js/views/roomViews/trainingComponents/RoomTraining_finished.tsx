import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import { TopBar } from '../../components/Topbar'
import {styles, colors, screenWidth, screenHeight, OrangeLine} from '../../styles'
import { Icon } from '../../components/Icon';

export class RoomTraining_finished extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <TopBar
          leftAction={ this.props.quit }
          title={"All Done!"}/>
        <OrangeLine/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center'
          }}>{"Finished learning about this room!"}</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{
            "Once you have taught " + this.props.ai.name + " all the rooms, " + this.props.ai.he + " will start doing " + this.props.ai.his + " best to determine in which room you are!\n\nPress the button below to go back!"}
          </Text>
          <View style={{flex:1}} />
          <TouchableOpacity
            style={[
              {borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth},
              styles.centered
            ]}
            onPress={() => { this.props.quit(); }}
          >
            <Icon name="md-cube" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </View>
    );
  }
}