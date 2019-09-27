
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial_multiple", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';



import { screenHeight, screenWidth, topBarHeight } from "../../../styles";
import { ScaledImage } from "../../../components/ScaledImage";
import { tutorialStyle } from "../AddSphereTutorial";


export class AddSphereTutorial_multiple extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{ lang("Multiple_Spheres") }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <ScaledImage source={require("../../../../images/tutorial/NoMultipleSpheresInHouse.png")} sourceHeight={481} sourceWidth={480} targetHeight={200} />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ lang("A_single_house_should_only") }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}