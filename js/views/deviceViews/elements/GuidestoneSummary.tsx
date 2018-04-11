import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth, availableScreenHeight} from '../../styles'
import {Util} from "../../../util/Util";

export class GuidestoneSummary extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {pendingCommand: false}
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const location = Util.data.getLocationFromStone(sphere, stone);

    let locationLabel = "Currently in Room:";
    let locationName = "No";
    if (location) {
      locationLabel = "Located in:";
      locationName = location.config.name;
    }

    return (
      <View style={{flex:1, paddingBottom:35}}>
        <View style={{flex:1}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{"Device Type:"}</Text>
          <Text style={deviceStyles.text}>{'Guidestone'}</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{"Connected to Mesh:"}</Text>
          <Text style={deviceStyles.text}>{stone.config.meshId ? 'Yes' : 'Not Yet'}</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center'}}>
          <Text style={deviceStyles.subText}>{locationLabel}</Text>
          <Text style={deviceStyles.text}>{locationName}</Text>
        </View>
        <View style={{flex: 0.2}} />
        <View style={{alignItems:'center', height: 0.2*availableScreenHeight}}>
          <Text style={deviceStyles.subText}>{"Reachable:"}</Text>
          <Text style={deviceStyles.text}>{stone.config.disabled === false ? 'Yes' : 'Searching...'}</Text>
          {
            stone.config.disabled  ?
              <ActivityIndicator animating={true} size='small' color={colors.white.hex} style={{paddingTop:20}} />
            : undefined
          }
        </View>

        <View style={{flex:1}} />
      </View>
    )
  }
}

let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  text: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});