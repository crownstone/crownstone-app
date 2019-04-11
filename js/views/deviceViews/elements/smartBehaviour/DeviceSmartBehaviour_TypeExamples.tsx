
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


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
import { core } from "../../../../core";
import { BehaviourConstructor } from "./SmartBehaviourLogic";


export class DeviceSmartBehaviour_TypeExamples extends Component<{examples:any[]}, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };

  getExamples() {
    let examples = [];
    this.props.examples.forEach((example, index) => {
      examples.push(<BehaviourExample data={example} key={"behaviourExample_" + index} />);
    })
    return examples;
  }


  render() {
    let iconHeight   = 0.10*availableScreenHeight;

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <ScrollView style={{height:availableScreenHeight, width: screenWidth,}}>
          <View style={{ width: screenWidth, alignItems:'center', paddingBottom:30 }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ "Smart Behaviour" }</Text>
            <View style={{height: 0.2*iconHeight}} />
            <Text style={textStyle.specification}>{"Presence aware behaviour"}</Text>
            <View style={{height: 0.2*iconHeight}} />
            <ScaledImage source={require('../../../../images/icons/presence.png')} sourceWidth={125} sourceHeight={162} targetWidth={0.15*availableScreenHeight} />
            <View style={{height: 0.2*iconHeight}} />
            <Text style={textStyle.explanation}>You can pick an example behaviour and change it to your liking, or make your own! Keep in mind that I'll be off when I'm not supposed to be on.</Text>
            <View style={{height: 0.2*iconHeight}} />
              { this.getExamples() }
            <View style={{height:1, backgroundColor:colors.menuBackground.rgba(0.3), width: screenWidth}} />
            <Text style={[textStyle.explanation,{padding:15}]}>or</Text>
            <BehaviourExample data={"Make your own!"} />
            <View style={{height:1, backgroundColor:colors.menuBackground.rgba(0.3), width: screenWidth}} />
          </View>
        </ScrollView>
      </Background>
    ) 
  }
}


class BehaviourExample extends Component<{data: any}, any> {
  render() {
    return (
      <View style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor:colors.menuBackground.rgba(0.3),
        backgroundColor:colors.white.rgba(0.3),
        width: screenWidth,
        alignItems:'center'}}>
        <View style={{width:screenWidth-20}}>
          <Text style={{
            fontWeight:'500',
            color:"#fff",
            fontSize:14,
            textAlign:'center',
            paddingLeft:30,
            paddingTop:20,
            paddingBottom:20,
            paddingRight:10
          }}>{createDescriptiveString(this.props.data)}</Text>
        </View>
        <Icon name="ios-arrow-forward" size={18} color={'#fff'} />
      </View>
    )
  }
}

function createDescriptiveString(rule) {
  if (typeof rule === 'string') { return rule; }

  let b = new BehaviourConstructor(rule as behaviour);
  return b.getSentence()
}