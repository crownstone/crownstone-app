import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight, topBarHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import {eventBus} from "../../../util/EventBus";
import {tutorialStyle} from "../Tutorial";
import {Util} from "../../../util/Util";


export class TutorialDevices extends Component<any, any> {
  render() {
    return (
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>Device Types</Text>
          <View style={{flex:1}} />
          <Icon
            name="c1-tvSetup"
            size={0.15*screenHeight}
            color={colors.white.hex}
          />
          <View style={{flex:1}} />
          <Text style={tutorialStyle.text}>{'You can add a device type to a Crownstone. These device types have behaviour, icons and names.' +
          '\n\nYou can add a single device type to multiple Crownstones. Behaviour of device types will overrule behaviour of Crownstones.'}</Text>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              eventBus.emit("userLoggedInFinished");
              let spheres = this.props.state.spheres;
              let sphereIds = Object.keys(spheres);

              let goToSphereOverview = () => {
                if (Platform.OS === 'android') {
                  this.props.eventBus.emit("userLoggedInFinished");
                  Actions.sphereOverview({type: 'reset'});
                }
                else {
                  this.props.eventBus.emit("userLoggedInFinished");
                  Actions.tabBar({type: 'reset'});
                }
              };

              // To avoid invited users get to see the Ai Naming, check if they have 1 sphere and if they're admin.
              // We can't do better at this moment.
              if (sphereIds.length === 1) {
                if (Util.data.getUserLevelInSphere(this.props.state, sphereIds[0]) === 'admin') {
                  Actions.aiStart();
                }
                else {
                  goToSphereOverview()
                }
                return;
              }
              else {
                goToSphereOverview()
              }
            }}
            style={[styles.centered, {
              width: 0.6 * screenWidth,
              height: 50,
              borderRadius: 25,
              borderWidth: 3,
              borderColor: colors.white.hex,
              backgroundColor: colors.csBlue.rgba(0.5)
            }]}>
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{"Got it!"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
    )
  }
}
