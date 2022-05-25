
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, View
} from "react-native";
import { TopBarUtil } from "../../util/TopBarUtil";
import { screenWidth } from "../styles";
import { TextButtonLight } from "../components/InterviewComponents";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SettingsNavbarBackground} from "../components/SettingsBackground";

export class RoomDeleted extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Deleted")})
  }

  render() {
    return (
      <SettingsNavbarBackground>
        <View style={{ flex:1, width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={{fontSize: 25, fontWeight:'bold', textAlign:'center'}}>{ lang("Room_Deleted_") }</Text>
          <View style={{flex:1}} />
          <TextButtonLight
            selected={false}
            label={ lang("Back_to_Sphere_")}
            callback={() => { NavigationUtil.back(); }}
          />
          <View style={{height: 30}} />
        </View>
      </SettingsNavbarBackground>
    )
  }

}


