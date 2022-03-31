
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial_intended", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';



import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../../styles";
import { ScaledImage } from "../../../components/ScaledImage";
import { createNewSphere } from "../../../../util/CreateSphere";
import { core } from "../../../../Core";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { Stacks } from "../../../Stacks";
import { tutorialStyle } from "../AddSphereTutorial";


export class AddSphereTutorial_intended extends Component<any, any> {
  render() {
    let buttonStyle = [styles.centered, {
      width: 0.75 * screenWidth,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: colors.white.hex,
      backgroundColor: colors.csBlue.rgba(0.5)
    }];

    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}} testID={"AddSphereTutorial_intended"}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={tutorialStyle.header}>{ lang("One_Sphere_per_House") }</Text>
          <View style={{width: screenWidth, height: 0.07*screenHeight}} />
          <View style={{flexDirection:'row'}}>
            <View style={{flex:0.5}} />
            <ScaledImage source={require("../../../../../assets/images/tutorial/Sphere_with_house.png")} sourceHeight={490} sourceWidth={490} targetWidth={screenWidth*0.35} />
            <View style={{flex:1}} />
            <ScaledImage source={require("../../../../../assets/images/tutorial/Sphere_with_house.png")} sourceHeight={490} sourceWidth={490} targetWidth={screenWidth*0.35} />
            <View style={{flex:0.5}} />
          </View>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ lang("Using_only_one_sphere_per") }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <TouchableOpacity
            onPress={() => {
              NavigationUtil.dismissModal();
            }}
            style={buttonStyle}
            testID={"AddSphere_nevermind"}
          >
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("I_dont_need_a_sphere") }</Text>
          </TouchableOpacity>
          <View style={{height:15}} />
          <TouchableOpacity
            onPress={() => {
              let state = core.store.getState();
              createNewSphere(state.user.firstName+"'s Sphere")
                .then((localSphereId) => {
                  core.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: localSphereId}});
                  NavigationUtil.dismissAllModals();
                  NavigationUtil.setRoot(Stacks.loggedIn());
                })
                .catch((err) => {
                  Alert.alert(lang("Whoops"), lang("Something_went_wrong_with"), [{ text: lang("OK") }])
                });
            }}
            style={buttonStyle}
            testID={"AddSphere_create"}
          >
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("I_understand_") }</Text>
          </TouchableOpacity>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}
