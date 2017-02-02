import React, { Component } from 'react'
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

import { TopBar } from '../components/Topbar'
import { Background } from '../components/Background'
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Icon } from '../components/Icon';
import { getAiData } from '../../util/dataUtil';
import { LOG } from '../../logging/Log'


let buttonTextStyle = {
  backgroundColor:'transparent',
  fontSize:15,
  fontWeight:'500',
  color: colors.menuBackground.hex,
  textAlign:'left',
};
let squareMeterStyle = {
  ...buttonTextStyle,
  position:'relative',
  top:-2,
  fontSize:12,
};

let buttonStyle = {
  backgroundColor: colors.white.rgba(0.3),
  borderRadius:2,
  height: 0.15*screenHeight,
  flexDirection:'row',
  alignItems:'center'
};

let iconContainerStyle = {
  width:0.3*screenWidth,
  alignItems:'center'
};

let textContainerStyle = {
  flexDirection:'row',
  width:0.7*screenWidth,
  paddingLeft: 10
};

export class RoomTraining_roomSize extends Component {
  _getButton(sampleSize, iconSize, text, roomSize) {
    return (
      <TouchableOpacity style={buttonStyle} onPress={() => { Actions.roomTraining({sphereId: this.props.sphereId, locationId: this.props.locationId, sampleSize: sampleSize, roomSize: roomSize}) }}>
        <View style={iconContainerStyle}>
          <Icon name="md-cube" size={iconSize} color={colors.blue.hex} style={{backgroundColor:"transparent"}} />
        </View>
        <View style={textContainerStyle}>
          <Text style={buttonTextStyle}>{text}</Text>
          <Text style={squareMeterStyle}>2</Text>
          <Text style={buttonTextStyle}>)</Text>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    let state = this.props.store.getState();
    let ai = getAiData(state, this.props.sphereId);

    return (
      <Background hideInterface={true} image={this.props.backgrounds.main}>
        <TopBar
          leftAction={ Actions.pop }
          title={"Teaching " + ai.name}/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.menuBackground.hex,
            textAlign:'center'
          }}>{"To let " + ai.name + " find you in this room, we need to help " + ai.him + " a little!"}</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'600',
            color: colors.menuBackground.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{"How large is this room?"}</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.menuBackground.hex,
            textAlign:'center',
            paddingTop:20,
          }}>Large rooms take a bit more time to learn about than small rooms.
          </Text>

          <View style={{flex:1}} />
          {this._getButton(30, Math.min(0.06*screenHeight,0.10*screenWidth), 'Small (up to 20 m', "small")}
          <View style={{flex:1}} />
          {this._getButton(60, Math.min(0.08*screenHeight,0.15*screenWidth), 'Medium (up to 50 m', "medium sized")}
          <View style={{flex:1}} />
          {this._getButton(90, Math.min(0.10*screenHeight,0.20*screenWidth), 'Large (more than 50 m', "large")}
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }
}