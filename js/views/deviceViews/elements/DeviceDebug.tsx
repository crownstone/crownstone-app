import * as React from 'react'; import { Component } from 'react';
import {
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

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import { LOG } from '../../../logging/Log'
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";
import {StoneUtil} from "../../../util/StoneUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "../../../util/DataUtil";
import {AnimatedCircle} from "../../components/animated/AnimatedCircle";
import {BatchCommandHandler} from "../../../logic/BatchCommandHandler";


export class DeviceDebug extends Component<any, any> {
  constructor() {
    super();
    this.state = {pendingCommand: false}
  }

  _getButton(stone) {
    let color = colors.green.hex;
    let size = 0.55*screenWidth;
    let innerSize = size - 8;
    let borderWidth = 3;

    if (stone.config.disabled) {
      color = colors.gray.hex;
      return (
        <View style={{width:0.75*screenWidth, height:size*1.05, alignItems:'center'}}>
          <View style={{flex:2}} />
          <Text style={deviceStyles.text}>{'Searching...'}</Text>
          <View style={{flex:1}} />
          <Text style={deviceStyles.subText}>{'Once I hear from this Crownstone, the button will reappear.'}</Text>
          <View style={{flex:1}} />
          <ActivityIndicator animating={true} size='small' color={colors.white.hex} />
          <View style={{flex:2}} />
        </View>
      );
    }


    if (this.state.pendingCommand === true) {
      return (
        <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
          <AnimatedCircle size={size} color={colors.white.hex}>
            <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={color}>
              <ActivityIndicator animating={true} size='large' color={colors.menuBackground.hex} />
            </AnimatedCircle>
          </AnimatedCircle>
        </AnimatedCircle>
      );
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          this.setState({pendingCommand:true});

          BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:'keepAliveBatchCommand'}, 5, 'from getButton in DeviceDebug')
            .then(() => {
              this.setState({pendingCommand: false});
              Alert.alert("Success!", "Sent message into Mesh.", [{text:'OK'}]);
            })
            .catch((err) => {
              this.setState({pendingCommand: false});
              Alert.alert("Failed to send message...", "Maybe try it again?", [{text:'OK'}]);
              LOG.error("DeviceTime: Could not send message:", err);
            });
          BatchCommandHandler.executePriority();

        }}>
          <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
            <AnimatedCircle size={size} color={colors.white.hex}>
              <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={color}>
                <Text style={{color: color, fontSize:23, fontWeight:'600', textAlign:'center'}}>{'Begin!'}</Text>
              </AnimatedCircle>
            </AnimatedCircle>
          </AnimatedCircle>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    return (
      <View style={{flex:1, alignItems:'center', padding: 30, paddingBottom:50}}>
        <Text style={deviceStyles.header}>Create Conflict</Text>
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems:'center'}}>{this._getButton(stone)}</View>
        <View style={{flex:1}} />
      </View>
    )
  }
}

let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});