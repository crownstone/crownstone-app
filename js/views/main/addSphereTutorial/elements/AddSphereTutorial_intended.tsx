
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial_intended", key)(a,b,c,d,e);
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

import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../../styles";
import { tutorialStyle } from "../../../tutorialViews/TutorialStyle";
import { ScaledImage } from "../../../components/ScaledImage";
import { eventBus } from "../../../../util/EventBus";
import { createNewSphere } from "../../../../util/CreateSphere";
import { BackAction } from "../../../../util/Back";


export class AddSphereTutorial_intended extends Component<any, any> {
  render() {
    let buttonStyle = [styles.centered, {
      width: 0.75 * screenWidth,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: colors.white.hex,
      backgroundColor: colors.csBlue.rgba(0.5)
    }]

    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{ lang("One_Sphere_per_House") }</Text>
          <View style={{width: screenWidth, height: 0.07*screenHeight}} />
          <View style={{flexDirection:'row'}}>
            <View style={{flex:0.5}} />
            <ScaledImage source={require("../../../../images/tutorial/Sphere_with_house.png")} sourceHeight={481} sourceWidth={480} targetWidth={screenWidth*0.35} />
            <View style={{flex:1}} />
            <ScaledImage source={require("../../../../images/tutorial/Sphere_with_house.png")} sourceHeight={481} sourceWidth={480} targetWidth={screenWidth*0.35} />
            <View style={{flex:0.5}} />
          </View>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ lang("Using_only_one_sphere_per") }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <TouchableOpacity
            onPress={() => {
              BackAction();
            }}
            style={buttonStyle}>
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("I_dont_need_a_sphere") }</Text>
          </TouchableOpacity>
          <View style={{height:15}} />
          <TouchableOpacity
            onPress={() => {
              let state = this.props.store.getState();
              createNewSphere(eventBus, this.props.store, state.user.firstName+"'s Sphere")
                .then((sphereId) => {
                  this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: sphereId}});
                  Actions.aiStart({sphereId: sphereId, resetViewStack: true})
                })
                .catch((err) => {
                  Alert.alert(lang("Whoops!"), lang("Something_went_wrong_with"), [{ text: lang("OK") }])
                });
            }}
            style={buttonStyle}>
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("I_understand_") }</Text>
          </TouchableOpacity>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}