
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SceneCreateNewItem", key)(a,b,c,d,e);
}
import { colors, screenWidth, styles } from "../../styles";
import { Text, TouchableOpacity, View } from "react-native";
import { SceneConstants } from "../constants/SceneConstants";
import { Icon } from "../../components/Icon";
import * as React from "react";


export function SceneCreateNewItem({callback, isFirst}) {
  let textColor = colors.white.hex;
  let color = colors.green.rgba(0.85)
  return (
    <View style={{
      flexDirection:'row', borderRadius: 10, overflow:'hidden',
      backgroundColor: "transparent",
      width:screenWidth - 2*SceneConstants.padding, height: SceneConstants.sceneHeight,
      alignItems:'center', marginBottom: 15,
      alignSelf:'center',
    }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{flexDirection:'row', height: SceneConstants.sceneHeight, flex:1, alignItems:'center', backgroundColor: colors.white.hex}}
        onPress={() => {
          callback()
        }}>
        <View style={{width: SceneConstants.sceneHeight, height: SceneConstants.sceneHeight}}>
          <View style={{width:SceneConstants.sceneHeight, height: SceneConstants.sceneHeight, backgroundColor: colors.green.hex, ...styles.centered}}>
            <Icon name="c3-addRounded" size={50} color={colors.white.hex} />
          </View>
        </View>
        <View style={{flexDirection:'row', backgroundColor: color, flex:1, height: SceneConstants.sceneHeight, alignItems:'center'}}>
          <View style={{width:2, height: SceneConstants.sceneHeight, backgroundColor: colors.white.rgba(0.1)}} />
          <View style={{paddingLeft:9}}>
            <View style={{flex:4}} />
            <Text style={{fontSize:18, fontWeight:'bold', color: textColor}}>{ lang("Create_new_Scene") }</Text>
            <View style={{flex:1}} />
            <Text style={{fontStyle:'italic',fontWeight:'bold', color: textColor}}>{ lang("Tap_me_to_get_started_Tap",isFirst) }</Text>
            <View style={{flex:4}} />
          </View>
          <View style={{flex:1}} />
        </View>
      </TouchableOpacity>
    </View>
  )
}
