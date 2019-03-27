
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";


import {
  availableScreenHeight,
  colors,
  deviceStyles,
  OrangeLine,
  screenWidth} from "../../../styles";
import { Background } from "../../../components/Background";
import { ScaledImage } from "../../../components/ScaledImage";
import { Icon } from "../../../components/Icon";
import { textStyle } from "./DeviceSmartBehaviour";

import {
  Svg,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { core } from "../../../../core";

export class DeviceSmartBehaviour_newBehaviour extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };


  render() {
    let descriptionTextStyle : TextStyle = {fontWeight:'bold', color: colors.white.hex, fontSize: 13, padding:4};
    let iconHeight  = 0.10*availableScreenHeight;
    let blockHeight = 0.22*availableScreenHeight;
    let textHeight  = 30;
    let iconBlockHeight = blockHeight - textHeight;

    let blockStyle        : ViewStyle = {width:0.5*screenWidth, height: blockHeight,      alignItems:'center'};
    let iconBlockStyle    : ViewStyle = {width:0.5*screenWidth, height: iconBlockHeight,  alignItems:'center', justifyContent:'center'};
    let textBlockStyle    : ViewStyle = {width:0.5*screenWidth, height: textHeight,       alignItems:'center', justifyContent:'flex-start'};
    let verticalLineStyle : ViewStyle = {width:1,               height: blockHeight,      backgroundColor: colors.menuBackground.rgba(0.2)};

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <View style={{ width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ "New Behaviour" }</Text>
          <View style={{height: 0.2*iconHeight}} />
          <Text style={textStyle.specification}>{"What sort of behaviour shall I learn?"}</Text>
          <View style={{height: 0.2*iconHeight}} />
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <ScaledImage source={require('../../../../images/icons/presence.png')} sourceWidth={125} sourceHeight={162} targetWidth={iconHeight} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Presence aware</Text>
              </View>
            </TouchableOpacity>
            <VerticalGradientLine height={blockHeight} color={colors.menuBackground.hex} />
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <Icon name={"c1-sunrise"} size={iconHeight*1.25} color={"#fff"} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Wake-up light</Text>
              </View>
            </TouchableOpacity>
          </View>
          <HorizontalGradientLine width={0.9*screenWidth} color={colors.menuBackground.hex} inverted={true} />
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <ScaledImage source={require('../../../../images/icons/smartTimer.png')} sourceWidth={140} sourceHeight={140} targetWidth={iconHeight} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Smart timer</Text>
              </View>
            </TouchableOpacity>
            <View style={verticalLineStyle} />
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <ScaledImage source={require('../../../../images/icons/twilight.png')} sourceWidth={149} sourceHeight={112} targetWidth={iconHeight} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Twilight mode</Text>
              </View>
            </TouchableOpacity>
          </View>
          <HorizontalGradientLine width={0.9*screenWidth} color={colors.menuBackground.hex} inverted={true} />
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <ScaledImage source={require('../../../../images/icons/childLock.png')} sourceWidth={124} sourceHeight={128} targetWidth={iconHeight} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Child safety</Text>
              </View>
            </TouchableOpacity>
            <VerticalGradientLine height={blockHeight} color={colors.menuBackground.hex} inverted={true} />
            <TouchableOpacity style={blockStyle}>
              <View style={iconBlockStyle}>
                <ScaledImage source={require('../../../../images/icons/custom.png')} sourceWidth={104} sourceHeight={104} targetWidth={iconHeight*0.8} />
              </View>
              <View style={textBlockStyle}>
                <Text style={descriptionTextStyle}>Custom</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </Background>
    )
  }
}


export class VerticalGradientLine extends Component<any, any> {
  render() {
     return (
       <Svg width={1} height={this.props.height}>
         <Defs>
           <LinearGradient id="grad" x1="0" y1="0" x2="0" y2={(this.props.height) + ""}>
             <Stop offset="0" stopColor={this.props.color} stopOpacity={this.props.inverted ? "0.3" : "0"} />
             <Stop offset="1" stopColor={this.props.color} stopOpacity={this.props.inverted ? "0" : "0.3"}  />
           </LinearGradient>
         </Defs>
         <Line
           x1="0"
           y1="0"
           x2="0"
           y2={this.props.height+""}
           stroke="url(#grad)"
           strokeWidth="1"
         />
       </Svg>
     );
  }
}

export class HorizontalGradientLine extends Component<any, any> {
  render() {
    return (
      <Svg width={this.props.width} height={1}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2={(this.props.width) + ""}  y2="0">
            <Stop offset="0"   stopColor={this.props.color} stopOpacity={"0"} />
            <Stop offset="0.5" stopColor={this.props.color} stopOpacity={"0.3"}  />
            <Stop offset="1"   stopColor={this.props.color} stopOpacity={"0.0"}  />
          </LinearGradient>
        </Defs>
        <Line
          x1="0"
          y1="0"
          x2={this.props.width+""}
          y2="0"
          stroke="url(#grad)"
          strokeWidth="1"
        />
      </Svg>
    );
  }
}