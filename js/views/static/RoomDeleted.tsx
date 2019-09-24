
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, View
} from "react-native";
import {Background} from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { screenWidth } from "../styles";
import { TextButtonLight } from "../components/InterviewComponents";
import { NavigationUtil } from "../../util/NavigationUtil";

export class RoomDeleted extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Deleted")})
  }

  render() {
    return (
      <Background image={require('../../images/backgrounds/lightBackground2.png')}>
        <View style={{ flex:1, width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={{fontSize: 25, fontWeight:'bold', textAlign:'center'}}>{ lang("Room_Deleted_") }</Text>
          <View style={{flex:1}} />
          <TextButtonLight
            selected={false}
            label={"Back to Sphere!"}
            callback={() => { NavigationUtil.back(); }}
          />
          <View style={{height: 30}} />
        </View>
      </Background>
    )
  }

}


