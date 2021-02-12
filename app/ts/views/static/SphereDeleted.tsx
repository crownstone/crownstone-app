
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, View
} from "react-native";
import {Background} from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { screenWidth } from "../styles";


export class SphereDeleted extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Deleted")})
  }

  render() {
    return (
      <Background image={require('../../../assets/images/backgrounds/mainBackgroundLightNotConnected.jpg')}>
        <View style={{ width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={{fontSize: 25, fontWeight:'bold', textAlign:'center'}}>{ lang("Sphere_Deleted_") }</Text>
          <View style={{flex:1}} />
        </View>
      </Background>
    )
  }

}


