
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StoneDeleted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text} from 'react-native';
import {Background} from "../components/Background";
import {OrangeLine} from "../styles";


export class StoneDeleted extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Deleted"),
    }
  };

  render() {
    return (
      <Background image={require('../../images/stoneDetails.png')}>
        <OrangeLine/>
        <Text>{ lang("Stone_Deleted_") }</Text>
      </Background>
    )
  }

}


