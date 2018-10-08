import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View
} from 'react-native';
import {Background} from "../components/Background";
import {OrangeLine, styles} from "../styles";


export class StoneDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("StoneDeleted", "Deleted")(),
    }
  };

  render() {
    return (
      <Background image={require('../../images/stoneDetails.png')}>
        <OrangeLine/>
        <Text>{ Languages.text("StoneDeleted", "Stone_Deleted_")() }</Text>
      </Background>
    )
  }

}


