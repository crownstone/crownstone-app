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


export class AddSphereTutorial_multiple extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{"Multiple Spheres"}</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <ScaledImage source={require("../../../../images/tutorial/NoMultipleSpheresInHouse.png")} sourceHeight={481} sourceWidth={480} targetHeight={200} />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{
            "A single house should only be a single sphere.\n\n" +
            "Indoor localization in a sphere only uses its own Crownstones.\n\n" +
            "Being present in multiple spheres at the same time can give rise to unwanted behaviour."
          }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}