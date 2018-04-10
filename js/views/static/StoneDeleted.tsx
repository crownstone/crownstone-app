import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import {Background} from "../components/Background";
import {colors, screenWidth} from "../styles";


export class StoneDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Deleted",
    }
  };

  render() {
    return (
      <Background image={this.props.backgrounds.detailsDark}>
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <Text>Stone Deleted.</Text>
      </Background>
    )
  }

}


