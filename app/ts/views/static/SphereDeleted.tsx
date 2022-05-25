
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, View
} from "react-native";
import { TopBarUtil } from "../../util/TopBarUtil";
import { screenWidth } from "../styles";
import {SettingsBackground} from "../components/SettingsBackground";


export class SphereDeleted extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Deleted")})
  }

  render() {
    return (
      <SettingsBackground>
        <View style={{ flex:1, width: screenWidth, alignItems:'center' }}>
          <View style={{flex:1}} />
          <Text style={{fontSize: 25, fontWeight:'bold', textAlign:'center'}}>{ lang("Sphere_Deleted_") }</Text>
          <View style={{flex:3}} />
        </View>
      </SettingsBackground>
    )
  }

}


