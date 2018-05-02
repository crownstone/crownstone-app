import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
let Actions = require('react-native-router-flux').Actions;

import { LOG }       from '../../logging/Log'
import {screenWidth, availableScreenHeight, topBarHeight} from '../styles'


export class AddItemsToSphere extends Component<any, any> {
  render() {
    const store = this.props.store;
    const state = store.getState();


    /**
     * eventBus.emit("showBlurredMenu", {
            fields:[
              {label:'Add Room',       onPress: () => { Actions.roomAdd({sphereId: params.activeSphereId}); }},
              {label:'Add Crownstone', onPress: () => {
                  Alert.alert(
                    "Adding a Crownstone",
                    "Plug the new Crownstone in and hold your phone close to it (touching it). " +
                    "It will automatically show up in this overview." +
                    "\n\nYou don't have to press this button for each Crownstone you add :).",
                    [{text: 'Buy', onPress: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }},{text: 'OK'}]
                  );
                }},
            ], position:{top: topBarHeight - 10, right:5}
     */
    return (
      <View style={{width: screenWidth, height: availableScreenHeight}}>

      </View>
    );
  }

}
