
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ContentNoSphere", key)(a,b,c,d,e);
}
import {Text, View} from "react-native";
import {topBarHeight} from "../../styles";
import * as React from "react";

export function ContentNoSphere(props) {
  return (
    <View style={{flex:1, alignItems:'flex-start', justifyContent:'center', paddingTop:topBarHeight}}>
      <View style={{flex:1}} />
      <Text style={{fontSize:22, fontWeight:'bold', padding:30}}>{ lang("No_sphere_selected___") }</Text>
      <Text style={{fontSize:16, fontWeight:'bold', padding:30}}>{ lang("Go_to_the_overview_and_se") }</Text>
      <View style={{flex:3}} />
    </View>
  );
}
