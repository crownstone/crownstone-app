import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Linking,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import {styles} from "../styles";


export class Logout extends Component<any, any> {
  render() {
    return (
      <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../../images/setupBackground.png')} />
    );
  }
}