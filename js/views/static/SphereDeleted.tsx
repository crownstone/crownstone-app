
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text} from 'react-native';
import {Background} from "../components/Background";
import {OrangeLine} from "../styles";


export class SphereDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Deleted"),
    }
  };

  render() {
    return (
      <Background image={require('../../images/mainBackgroundLightNotConnected.png')}>
        <OrangeLine/>
        <Text>{ lang("Sphere_Deleted_") }</Text>
      </Background>
    )
  }

}


