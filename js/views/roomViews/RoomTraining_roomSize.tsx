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

import { Background }   from '../components/Background'
import {colors, screenWidth, screenHeight, OrangeLine} from '../styles'
import { Icon }         from '../components/Icon';
import { Util }         from "../../util/Util";


let buttonTextStyle = {
  backgroundColor:'transparent',
  fontSize:15,
  fontWeight:'500',
  color: colors.white.hex,
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

export class RoomTraining_roomSize extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    let paramsToUse = params;
    if (!params.title) {
      if (NAVBAR_PARAMS_CACHE !== null) {
        paramsToUse = NAVBAR_PARAMS_CACHE;
      }
      else {
        paramsToUse = getNavBarParams(params.store.getState(), params, true);
      }
    }

    return {
      title: paramsToUse.title,
    }
  };

  _getButton(sampleSize, iconSize, text, roomSize) {
    return (
      <TouchableOpacity style={buttonStyle} onPress={() => { Actions.roomTraining({sphereId: this.props.sphereId, locationId: this.props.locationId, sampleSize: sampleSize, roomSize: roomSize}) }}>
        <View style={iconContainerStyle}>
          <Icon name="md-cube" size={iconSize} color={colors.green.hex} style={{backgroundColor:"transparent"}} />
        </View>
        <View style={textContainerStyle}>
          <Text style={buttonTextStyle}>{text}</Text>
          <Text style={squareMeterStyle}>2</Text>
          <Text style={buttonTextStyle}>)</Text>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    let state = this.props.store.getState();
    let ai = Util.data.getAiData(state, this.props.sphereId);
    let roomName = state.spheres[this.props.sphereId].locations[this.props.locationId].config.name || 'this room';

    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <View style={{flex:1}} />
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center'
          }}>{"To let " + ai.name + " find you in " + roomName + ", we need to help " + ai.him + " a little!"}</Text>

          <View style={{flex:2}} />
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center',
          }}>{"How large is this room?"}</Text>

          <View style={{flex:1}} />
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
          }}>Large rooms take a bit more time to learn about than small rooms.
          </Text>

          <View style={{flex:3}} />
          {this._getButton(30, Math.min(0.06*screenHeight,0.10*screenWidth), 'Small (up to 20 m', "small")}
          <View style={{flex:1}} />
          {this._getButton(60, Math.min(0.08*screenHeight,0.15*screenWidth), 'Medium (up to 50 m', "medium sized")}
          <View style={{flex:1}} />
          {this._getButton(90, Math.min(0.10*screenHeight,0.20*screenWidth), 'Large (more than 50 m', "large")}
          <View style={{flex:2}} />
        </View>
      </Background>
    );
  }
}


function getNavBarParams(state, props, viewingRemotely) {
  let ai = Util.data.getAiData(state, props.sphereId);
  NAVBAR_PARAMS_CACHE = {title: 'Teaching ' + ai.name};
  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE = null;
