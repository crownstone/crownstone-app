
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TopbarButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { topBarHeight, statusBarHeight, colors } from "../../styles";
import {topBarStyle} from "./TopbarStyles";
import { Icon } from "../Icon";

let barHeight = topBarHeight - statusBarHeight;


export class TopbarButton extends Component<any, any> {
  render() {
    let alignmentStyle = this.props.alignmentStyle || topBarStyle.topBarRightTouch;
    let style = [alignmentStyle, this.props.style] //, {position:'relative', left:16, paddingRight:16, backgroundColor:"#f00"}

    if ( this.props.item ) {
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}} style={style}>
          {this.props.item}
        </TouchableOpacity>
      );
    }
    else if ( this.props.text ) {
      let text = this.props.text;
      if (typeof this.props.text === 'function') {
        text = this.props.text();
      }

      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}}  style={style}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            { this.props.icon }
            <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.style]}>{text}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else if ( this.props.icon ) {
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}}  style={style}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            { this.props.icon }
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={[alignmentStyle, this.props.style]} />;
  }
}


export class TopbarEmptyButton extends Component<any, any> {
  render() {
    return <View />
  }
}

export class TopbarLeftButton extends Component<any, any> {
  render() {
    return <TopbarButton {...this.props} alignmentStyle={topBarStyle.topBarLeftTouch}/>
  }
}

export class TopbarLeftButtonNav extends Component<any, any> {
  render() {
    return <TopbarButton {...this.props} alignmentStyle={{ // backgroundColor:'#ff0',
      height:barHeight,
      width:80,
      alignItems:'flex-start',
      justifyContent:'center'
    }}/>
  }
}

export class TopbarBackButton extends Component<any, any> {
  render() {
    let alignmentStyle = this.props.alignmentStyle || topBarStyle.topBarLeftTouch;
    if ( this.props.item ) {
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}} style={[alignmentStyle, this.props.style]}>
          {this.props.item}
        </TouchableOpacity>
      );
    }
    else if ( this.props.text ) {
      let text = this.props.text;
      if (typeof this.props.text === 'function') {
        text = this.props.text();
      }
      return (
        <TouchableOpacity onPress={() => {this.props.onPress();}}  style={[alignmentStyle, this.props.style]}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-end', flex:0, height: barHeight}}>
            <Icon name="ios-arrow-back" size={33} color={colors.white.hex} style={{paddingRight:6, marginTop:2}} />
            {/*<Icon name="md-arrow-back" size={20} color={colors.white.hex} style={{paddingRight:6, marginTop:2}} />*/}
            <Text style={[topBarStyle.topBarLeft, topBarStyle.leftText, this.props.style]}>{text}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={[alignmentStyle, this.props.style]} />;
  }
}


export class TopbarRightButton extends Component<any, any> {
  render() {
    return <TopbarButton {...this.props} alignmentStyle={topBarStyle.topBarRightTouch}/>
  }
}



export class TopbarRightMoreButton extends Component<any, any> {
  render() {
    return <TopbarButton {...this.props} alignmentStyle={{ height:barHeight, width:80}} icon={<Icon name={'md-more'} color={colors.white.hex} size={30} />}/>
  }
}


export class TopbarRightHelpButton extends Component<any, any> {
  render() {
    return <TopbarButton {...this.props} alignmentStyle={{ height:barHeight, width:30}} icon={<Icon name={'ion5-md-help-circle-outline'} color={colors.iosBlue.hex} size={30} />}/>
  }
}
