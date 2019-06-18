
import { Languages } from "../../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_TypeExamples", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import {
  availableScreenHeight,
  colors,
  deviceStyles,
  screenWidth} from "../../../../styles";
import { Background } from "../../../../components/Background";
import { Icon } from "../../../../components/Icon";
import { core } from "../../../../../core";
import { NavigationUtil } from "../../../../../util/NavigationUtil";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";


export class DeviceSmartBehaviour_TypeExamples extends Component<{examples:any[], image: any, header:string, twilightRules: boolean, sphereId: string, stoneId: string}, any> {
  getExamples() {
    let examples = [];
    this.props.examples.forEach((example, index) => {
      examples.push(<BehaviourExample data={example} key={"behaviourExample_" + index} twilightRule={this.props.twilightRules} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />);
    });
    return examples;
  }

  render() {
    let iconHeight   = 0.10*availableScreenHeight;

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <ScrollView style={{height:availableScreenHeight, width: screenWidth,}}>
          <View style={{ width: screenWidth, alignItems:'center', paddingBottom:30 }}>
            <View style={{height: 30}} />
            <Text style={deviceStyles.header}>{this.props.header}</Text>
            <View style={{height: 0.75*iconHeight}} />
            { this.props.image }
            <View style={{height: 0.5*iconHeight}} />
            <Text style={deviceStyles.explanation}>{ lang("Pick_an_example_behaviour_") }</Text>
            <View style={{height: 0.2*iconHeight}} />
              { this.getExamples() }
            <View style={{height:1, backgroundColor:colors.menuBackground.rgba(0.3), width: screenWidth}} />
          </View>
        </ScrollView>
      </Background>
    ) 
  }
}


class BehaviourExample extends Component<{data: AicoreBehaviour | AicoreTwilight, twilightRule: boolean, stoneId: string, sphereId: string}, any> {
  render() {
    return (
      <TouchableOpacity style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor:colors.menuBackground.rgba(0.3),
        backgroundColor:colors.white.rgba(0.3),
        width: screenWidth,
        alignItems:'center'}}
      onPress={() => { NavigationUtil.navigate( "DeviceSmartBehaviour_Editor", {...this.props})}}>
        <View style={{width:screenWidth-20}}>
          <Text style={{
            fontWeight:'500',
            color:"#fff",
            fontSize:16,
            textAlign:'center',
            paddingLeft:30,
            paddingTop:20,
            paddingBottom:20,
            paddingRight:10
          }}>{this.props.data.getSentence()}</Text>
        </View>
        <Icon name="ios-arrow-forward" size={18} color={'#fff'} />
      </TouchableOpacity>
    )
  }
}