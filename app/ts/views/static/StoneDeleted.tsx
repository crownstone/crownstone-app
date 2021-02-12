
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, View
} from "react-native";
import {Background} from "../components/Background";
import { TopBarUtil } from "../../util/TopBarUtil";
import { availableScreenHeight, deviceStyles, screenWidth } from "../styles";
import { TextButtonLight } from "../components/InterviewComponents";
import { NavigationUtil } from "../../util/NavigationUtil";


export class StoneDeleted extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Deleted")})
  };

  render() {
    return (
      <Background image={require('../../../assets/images/backgrounds/stoneDetails.jpg')}>
        <View style={{flex:1, width: screenWidth, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={deviceStyles.header}>{ lang("Stone_Deleted_") }</Text>
          <View style={{flex:1}} />
          <TextButtonLight
            selected={false}
            label={ lang("Back_to_room_")}
            callback={() => { NavigationUtil.back(); }}
          />
          <View style={{height: 30}} />
        </View>
      </Background>
    )
  }

}


