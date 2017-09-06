import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;
import { screenHeight, tabBarHeight, topBarHeight } from '../styles'


export class MessageInbox extends Component<any, any> {
  unsubscribeStoreEvents : any[] = [];
  unsubscribeSetupEvents : any[] = [];

  constructor() {
    super();
    this.state = {

    };
  }

  componentWillMount() {

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    return <View />
  }
}