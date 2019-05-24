
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle, ScrollView
} from "react-native";


import {
  availableScreenHeight,
  colors,
  deviceStyles,
  screenWidth} from "../../../styles";
import { Background } from "../../../components/Background";
import { ScaledImage } from "../../../components/ScaledImage";
import { Icon } from "../../../components/Icon";

import {
  Svg,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { core } from "../../../../core";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { SMART_BEHAVIOUR_TYPES } from "../../../../Enums";
import { TopBarUtil } from "../../../../util/TopBarUtil";

export class DeviceSmartBehaviour_TypeSelector extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("A_Crownstone")});
  }


  render() {
    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <DeviceSmartBehaviour_TypeSelectorBody {...this.props} />
      </Background>
    )
  }
}

export class DeviceSmartBehaviour_TypeSelectorBody extends Component<any, any> {
  render() {
    let iconHeight  = 0.10*availableScreenHeight;
    let blockHeight = 0.22*availableScreenHeight;

    let verticalLineStyle : ViewStyle = {width:1, height: blockHeight, backgroundColor: colors.menuBackground.rgba(0.2)};
    let blockWrapperStyle : ViewStyle = { flexDirection: 'row',  paddingLeft:0.05*screenWidth, paddingRight: 0.05*screenWidth };

    return (
      <ScrollView>
      <View style={{ width: screenWidth, minHeight:availableScreenHeight, alignItems:'center' }}>
        <View style={{height: 30}} />
        <Text style={[deviceStyles.header]}>{ lang("New_Behaviour") }</Text>
        <View style={{height: 0.2*iconHeight}} />
        <Text style={deviceStyles.specification}>{ lang("What_sort_of_behaviour_sha") }</Text>
        <View style={{height: 0.2*iconHeight}} />
        <View style={{flex:1}} />
        <View style={blockWrapperStyle}>
          <TypeBlock
            {...this.props}
            image={{source: require('../../../../images/icons/presence.png'), width: 125, height: 162}}
            type={SMART_BEHAVIOUR_TYPES.PRESENCE}
            label={ lang("Presence_aware")}
          />
          <VerticalGradientLine height={blockHeight} color={colors.csBlueDark.hex} />
          <TypeBlock
            {...this.props}
            image={{source: require('../../../../images/icons/smartTimer.png'), width: 140, height: 140}}
            type={SMART_BEHAVIOUR_TYPES.SMART_TIMER}
            label={ lang("Smart_timer")}
          />
        </View>
        <HorizontalGradientLine width={0.9*screenWidth} color={colors.csBlueDark.hex} inverted={true} />
        <View style={blockWrapperStyle}>
          <TypeBlock
            {...this.props}
            image={{source: require('../../../../images/icons/childLock.png'), width: 124, height: 128}}
            type={SMART_BEHAVIOUR_TYPES.CHILD_SAFETY}
            label={ lang("Child_safety")}
          />
          <VerticalGradientLine height={blockHeight} color={colors.csBlueDark.hex} inverted={true} />
          <TypeBlock
            {...this.props}
            image={{source: require('../../../../images/icons/twilight.png'), width: 149, height: 112}}
            type={SMART_BEHAVIOUR_TYPES.TWILIGHT_MODE}
            label={ lang("Twilight_mode")}
          />
        </View>
        <View style={{flex: 10}} />
      </View>
      </ScrollView>
    );
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
            <Stop offset="0.5" stopColor={this.props.color} stopOpacity={ lang("___")}  />
            <Stop offset="1"   stopColor={this.props.color} stopOpacity={ lang("___")}  />
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


class TypeBlock extends Component<any, any> {
  render() {
    let descriptionTextStyle : TextStyle = {fontWeight:'bold', color: colors.white.hex, fontSize: 13, padding:4};
    let iconHeight  = 0.10*availableScreenHeight;
    let blockHeight = 0.22*availableScreenHeight;
    let textHeight  = 30;
    let iconBlockHeight = blockHeight - textHeight;

    let blockStyle        : ViewStyle = {width:0.45*screenWidth, height: blockHeight,      alignItems:'center'};
    let iconBlockStyle    : ViewStyle = {width:0.45*screenWidth, height: iconBlockHeight,  alignItems:'center', justifyContent:'center'};
    let textBlockStyle    : ViewStyle = {width:0.45*screenWidth, height: textHeight,       alignItems:'center', justifyContent:'flex-start'};


    return (
      <TouchableOpacity
        style={blockStyle}
        onPress={() => {
          NavigationUtil.navigate(
            "DeviceSmartBehaviour_TypeStart",
            {sphereId: this.props.sphereId, stoneId: this.props.stoneId, type: this.props.type});
        }}>
        <View style={iconBlockStyle}>
          { !this.props.image ? undefined :
            <ScaledImage
              source={this.props.image.source}
              sourceWidth={this.props.image.width}
              sourceHeight={this.props.image.height}
              targetWidth={this.props.image.factor ? this.props.image.factor*iconHeight : iconHeight}
            /> }
          { !this.props.icon  ? undefined :
            <Icon
              name={this.props.icon.name}
              size={this.props.icon.size}
              color={colors.white.hex}
            /> }
        </View>
        <View style={textBlockStyle}>
          <Text style={descriptionTextStyle}>{this.props.label}</Text>
        </View>
      </TouchableOpacity>
    )
  }
}