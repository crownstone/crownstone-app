import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View
} from 'react-native';
import {Background} from "../components/Background";
import {OrangeLine, styles} from "../styles";


export class SphereDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("SphereDeleted", "Deleted")(),
    }
  };

  render() {
    return (
      <Background image={require('../../images/mainBackgroundLightNotConnected.png')}>
        <OrangeLine/>
        <Text>{ Languages.text("SphereDeleted", "Sphere_Deleted_")() }</Text>
      </Background>
    )
  }

}


