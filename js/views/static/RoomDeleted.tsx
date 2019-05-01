
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text} from 'react-native';
import {Background} from "../components/Background";
import {} from "../styles";

export class RoomDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Deleted"),
    }
  };

  render() {
    return (
      <Background image={require('../../images/backgrounds/mainBackgroundLightNotConnected.png')}>
                <Text>{ lang("Room_Deleted_") }</Text>
      </Background>
    )
  }

}


