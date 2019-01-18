import { Languages } from "../../../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereIntroduction", key)(a,b,c,d,e);
}
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

import { colors, screenHeight, screenWidth, topBarHeight } from "../../../styles";
import { tutorialStyle } from "../../../tutorialViews/TutorialStyle";
import { ScaledImage } from "../../../components/ScaledImage";


export class AddSphereTutorial_introduction extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{"What is a Sphere?"}</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <ScaledImage source={require("../../../../images/tutorial/Sphere_with_house.png")} sourceHeight={481} sourceWidth={480} targetHeight={200} />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{
            "Spheres are individual, separated collections of Crownstones.\n\n" +
            "Crownstones in different spheres cannot talk to eachother.\n\n" +
            "Every sphere has it's own collection of users."
          }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}