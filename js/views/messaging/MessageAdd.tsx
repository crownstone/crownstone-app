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
import {availableScreenHeight, colors, screenHeight, screenWidth, tabBarHeight, topBarHeight} from '../styles'
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {IconButton} from "../components/IconButton";
import {Util} from "../../util/Util";
import {ListEditableItems} from "../components/ListEditableItems";
import {Icon} from "../components/Icon";


export class MessageAdd extends Component<any, any> {
  unsubscribeStoreEvents : any[] = [];
  unsubscribeSetupEvents : any[] = [];

  constructor() {
    super();

    this.state = {
      triggerLocationId: null,
      triggerEvent: null,
      messageContent: null,
      recipients: {}
    };
  }

  componentWillMount() {

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  _createMessage() {

  }

  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let locationIds = Object.keys(sphere.locations);

    let locationData = [];
    locationIds.forEach((locationId) => {
      let location = sphere.locations[locationId];
      locationData.push({locationId: locationId, name: location.config.name, location: location});
    });

    let sphereUserData = sphere.users;

    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          right={'Create'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={() => { this._createMessage(); }}
          title={"Add Schedule"}
        />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView style={{flex:1}}>
          <View style={{alignItems:'center', width: screenWidth}}>
          </View>
        </ScrollView>
      </Background>
      );
  }
}
