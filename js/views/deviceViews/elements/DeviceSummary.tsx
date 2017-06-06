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


export class DeviceSummary extends Component<any, any> {
  constructor() {
    super();
    this.state = {pending: false}
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  _getIcon(stone, element) {
    let currentState = stone.state.state;
    let color = colors.menuBackground.hex;
    if (currentState > 0) {
      color = colors.green.hex;
    }

    let size = 0.35*screenWidth;
    let innerSize = size - 6;
    return (
      <TouchableOpacity onPress={() => {
        Actions.applianceSelection({
          sphereId: this.props.sphereId,
          applianceId: stone.config.applianceId,
          stoneId: this.props.stoneId,
          callback: (applianceId) => {
            this.props.store.dispatch({
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            type: 'UPDATE_STONE_CONFIG',
            data: {applianceId: applianceId}
          });
        }});
      }} >
        <Circle size={size*1.05} color={colors.black.rgba(0.08)}>
          <Circle size={size} color={color}>
            <Ring size={innerSize} color={color} borderWidth={3}>
              <Icon name={element.config.icon} size={0.575*innerSize} color={'#fff'} />
            </Ring>
          </Circle>
        </Circle>
      </TouchableOpacity>
    );
  }

  _getButton(stone) {
    let currentState = stone.state.state;
    let label = 'Turn On';
    let color = colors.green.hex;
    if (currentState > 0) {
      label = 'Turn Off';
      color = colors.menuBackground.hex;
    }
    let size = 0.4*screenWidth;
    let innerSize = size - 10;
    if (this.state.pending === true) {
      return (
        <Circle size={size*1.05} color={colors.black.rgba(0.08)}>
          <Circle size={size} color={colors.white.hex}>
            <Ring size={innerSize} color={colors.white.hex} borderWidth={6} borderColor={color}>
              <ActivityIndicator animating={true} size='large' color={colors.menuBackground.hex} />
            </Ring>
          </Circle>
        </Circle>
      );
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          let newState = (currentState === 1 ? 0 : 1);
          this.setState({pendingCommand:true});

          StoneUtil.switchBHC(
            this.props.sphereId,
            this.props.stoneId,
            stone,
            newState,
            this.props.store,
            () => { this.setState({pendingCommand:false});}
          );

        }}>
          <Circle size={size*1.05} color={colors.black.rgba(0.08)}>
            <Circle size={size} color={colors.white.hex}>
              <Ring size={innerSize} color={colors.white.hex} borderWidth={6} borderColor={color}>
                <Text style={{color: color, fontSize:22, fontWeight:'500'}}>{label}</Text>
              </Ring>
            </Circle>
          </Circle>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const element = Util.data.getElement(state.spheres[this.props.sphereId], stone);

    return (
      <View style={{flex:1}}>
        <DeviceInformation left={"Energy Consumption:"} leftValue={"1000 W"} right={"Located in:"} rightValue={"Living Room"} />
        <DeviceInformation left={stone.config.applianceId ? "Crownstone Name:" : "Connected Device:"}
                           leftValue={stone.config.applianceId ? stone.config.name : 'None'}
                           right={"Connected to Mesh:"} rightValue={stone.config.meshId ? 'Yes' : 'Not Yet'} />
        <View style={{flex:0.5}} />
        <View style={{width:screenWidth, alignItems:'center'}}>{this._getIcon(stone, element)}</View>
        <View style={{flex:1}} />
        <Text style={deviceStyles.explanation}>{stone.config.applianceId ? Util.spreadString('tap icon to change device') : Util.spreadString('tap icon to select device')}</Text>
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems:'center'}}>{this._getButton(stone)}</View>
        <View style={{flex:1.5}} />
      </View>
    )
  }
}


export class DeviceInformation extends Component<any, any> {
  render() {
    return (
      <View>
        <View style={{width:screenWidth, flexDirection:'row', padding:10, paddingBottom:0}}>
          <Text style={deviceStyles.subText}>{this.props.left}</Text>
          <View style={{flex:1}} />
          <Text style={[deviceStyles.subText]}>{this.props.right}</Text>
        </View>
        <View style={{width:screenWidth, flexDirection:'row', paddingLeft:10, paddingRight:10}}>
          <Text style={deviceStyles.text}>{this.props.leftValue}</Text>
          <View style={{flex:1}} />
          <Text style={[deviceStyles.text]}>{this.props.rightValue}</Text>
        </View>
      </View>
    )
  }
}


export class Circle extends Component<any, any> {
  render() {
    let size = this.props.size;
    return (
      <View style={[{
        width:size,
        height:size,
        borderRadius:0.5*size,
        backgroundColor: this.props.color,
      }, styles.centered]}>
        {this.props.children}
      </View>
    )
  }
}

export class Ring extends Component<any, any> {
  render() {
    let size = this.props.size;
    return (
      <View style={[{
        width:size,
        height:size,
        borderRadius:0.5*size,
        backgroundColor: this.props.color,
        borderWidth: this.props.borderWidth || 6,
        borderColor: this.props.borderColor || colors.white.hex
      }, styles.centered]}>
        {this.props.children}
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