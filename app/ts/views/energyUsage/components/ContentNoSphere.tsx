import {Text, View} from "react-native";
import {topBarHeight} from "../../styles";
import * as React from "react";

export function ContentNoSphere(props) {
  return (
    <View style={{flex:1, alignItems:'flex-start', justifyContent:'center', paddingTop:topBarHeight}}>
      <View style={{flex:1}} />
      <Text style={{fontSize:22, fontWeight:'bold', padding:30}}>{ 'No sphere selected...' }</Text>
      <Text style={{fontSize:16, fontWeight:'bold', padding:30}}>{ "Go to the overview and select a sphere." }</Text>
      <View style={{flex:3}} />
    </View>
  );
}
