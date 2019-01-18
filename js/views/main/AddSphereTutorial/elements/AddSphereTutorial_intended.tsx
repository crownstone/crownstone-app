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


export class AddSphereTutorial_intended extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{"One Sphere per House"}</Text>
          <View style={{width: screenWidth, height: 0.07*screenHeight}} />
          <View style={{flexDirection:'row'}}>
            <View style={{flex:0.5}} />
            <ScaledImage source={require("../../../../images/tutorial/Sphere_with_house.png")} sourceHeight={481} sourceWidth={480} targetWidth={screenWidth*0.35} />
            <View style={{flex:1}} />
            <ScaledImage source={require("../../../../images/tutorial/Sphere_with_house.png")} sourceHeight={481} sourceWidth={480} targetWidth={screenWidth*0.35} />
            <View style={{flex:0.5}} />
          </View>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{
            "Using only one sphere per individual building (like house, office or holiday home), you can add up to 20 spheres!\n\n" +
            "If you want to create a new sphere, tap the button below.\n\nIf you do not need a new sphere after all, press back in the top left corner!"
          }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <TouchableOpacity
            onPress={() => {
              let state = this.props.store.getState();
              createNewSphere(eventBus, this.props.store, state.user.firstName+"'s Sphere")
                .then((sphereId) => {
                  this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: sphereId}});
                  Actions.aiStart({sphereId: sphereId, resetViewStack: true})
                })
                .catch((err) => {
                  Alert("Whoops!", "Something went wrong with the creation of your Sphere.", [{text:"OK"}])
                });
            }}
            style={[styles.centered, {
              width: 0.6 * screenWidth,
              height: 50,
              borderRadius: 25,
              borderWidth: 3,
              borderColor: colors.white.hex,
              backgroundColor: colors.csBlue.rgba(0.5)
            }]}>
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{"I understand!"}</Text>
          </TouchableOpacity>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}