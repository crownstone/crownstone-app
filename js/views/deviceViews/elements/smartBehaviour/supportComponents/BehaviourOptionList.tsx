import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View} from "react-native";
import { colors, deviceStyles, screenWidth} from "../../../../styles";
import { BehaviourSubmitButton } from "./BehaviourSubmitButton";



export class BehaviourOptionList extends Component<{
    closeLabel: string,
    closeCallback: () => void,
    explanation?: string,
    header: string,
    elements: behaviourListElement[]
  },any> {


  _getElements() {
    let elements = [];
    this.props.elements.forEach((el,i) => {
      elements.push(
        <TouchableOpacity
          key={"behaviourElement_"+ i}
          style={{
            flexDirection:'row',
            width: screenWidth, height:50,
            borderTopWidth:1, borderColor: colors.menuBackground.rgba(0.7),
            backgroundColor: el.isSelected() ? colors.green.hex : colors.white.rgba(0.8),
            alignItems:'center',
          }}
          onPress={() => { el.onSelect() }}
        >
        <Text style={{paddingLeft:15, fontSize:15}}>{el.label}</Text>
        {el.subLabel ? <View style={{flex:1}} /> : undefined}
        {el.subLabel ? <Text style={{paddingRight:15, fontSize:15, color: colors.black.rgba(0.2)}}>{el.subLabel}</Text> : undefined}
      </TouchableOpacity>
      )
    });

    return elements;
  }

  render() {
    return (
      <View style={{width:screenWidth, flex:1, alignItems:'center'}}>
        <View style={{flex:1}} />
        <Text style={deviceStyles.specification}>{this.props.header}</Text>

        { this._getElements() }

        <View style={{width: screenWidth, height:1, backgroundColor: colors.menuBackground.rgba(0.7)}} />

        { this.props.explanation ? <Text style={[deviceStyles.explanation, {padding: 10, color: colors.csBlueDark.rgba(0.7)}]}>{this.props.explanation}</Text> : undefined }

        <View style={{flex:1, minHeight:15}} />
        <BehaviourSubmitButton callback={this.props.closeCallback} label={this.props.closeLabel} />
        <View style={{flex:1, minHeight:15}} />
      </View>
    );
  }
}
