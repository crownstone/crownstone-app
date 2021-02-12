
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SceneIntroduction", key)(a,b,c,d,e);
}
import { Image, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, deviceStyles, screenWidth, styles } from "../../styles";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Icon } from "../../components/Icon";
import * as React from "react";


export function ScenesWithoutSpheres() {
  return (
    <View style={{flex:1, padding: 30, ...styles.centered}}>
      <View style={{flex:1}} />
      <TouchableOpacity style={styles.centered} onPress={() => { NavigationUtil.launchModal("AddSphereTutorial") }}>
        <Image source={require('../../../../assets/images/scenes/relax/relax_7.jpg')} style={{width: 0.5*screenWidth, height:0.5*0.75*screenWidth, borderRadius: 20, marginBottom:30}} />
        <Text style={deviceStyles.text}>{ lang("Add_a_sphere_to_use_Scene") }</Text>
      </TouchableOpacity>
      <View style={{flex:2}} />
    </View>
  );
}

export function SceneIntroduction({sphereId}) {
  let addIconStyle : ViewStyle = {width:40, height:40, borderRadius:20, overflow:"hidden", backgroundColor:"#fff", alignItems:'center', justifyContent:'center', position:'absolute', top:0,right:0};
  let margin = 18;
  return (
    <View style={{ flexGrow: 1, alignItems:'center', padding: 30 }}>
      <View style={{flex:1}} />
      <TouchableOpacity style={styles.centered} onPress={() => { NavigationUtil.launchModal("SceneAdd", {sphereId: sphereId}) }}>
        <View style={{width: 0.5*screenWidth+2*margin, height:0.5*0.75*screenWidth+margin, overflow:'hidden', marginBottom:30}}>
          <Image source={require('../../../../assets/images/scenes/relax/relax_7.jpg')} style={{width: 0.5*screenWidth, height:0.5*0.75*screenWidth, borderRadius: 20, marginLeft:margin, marginTop:margin}} />
          <View style={addIconStyle}><Icon name={'md-add-circle'} size={42} color={colors.green.hex}/></View>
        </View>
        <Text style={deviceStyles.header}>{ lang("Lets_make_a_Scene_") }</Text>
        <View style={{flex:0.2}} />
        <Text style={deviceStyles.text}>{ lang("Scenes_allow_you_to_quick") }</Text>
      </TouchableOpacity>
      <View style={{flex:2}} />
    </View>
  )
}

