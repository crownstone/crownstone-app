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
      title: "Deleted",
    }
  };

  render() {
    return (
      <Background image={<Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../../images/stoneDetails.png')} />}>
        <OrangeLine/>
        <Text>Stone Deleted.</Text>
      </Background>
    )
  }

}


