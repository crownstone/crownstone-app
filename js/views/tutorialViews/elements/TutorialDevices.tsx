import { Languages } from "../../../Languages"
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

import {styles, colors, screenWidth, screenHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import {eventBus} from "../../../util/EventBus";
import {tutorialStyle} from "../Tutorial";
import {Util} from "../../../util/Util";


export class TutorialDevices extends Component<any, any> {
  render() {
    return (
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>{ Languages.text("TutorialDevices", "Device_Types")() }</Text>
          <View style={{flex:1}} />
          <Icon
            name="c1-tvSetup"
            size={0.15*screenHeight}
            color={colors.white.hex}
          />
          <View style={{flex:1}} />
          <Text style={tutorialStyle.text}>{ Languages.text("TutorialDevices", "You_can_add_a_device_type")() }</Text>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              eventBus.emit("userLoggedInFinished");
              let spheres = this.props.state.spheres;
              let sphereIds = Object.keys(spheres);

              let goToSphereOverview = () => {
                if (Platform.OS === 'android') {
                  eventBus.emit("userLoggedInFinished");
                  Actions.drawer({type: 'reset'});
                }
                else {
                  eventBus.emit("userLoggedInFinished");
                  Actions.tabBar({type: 'reset'});
                }
              };

              // To avoid invited users get to see the Ai Naming, check if they have 1 sphere and if they're admin and if there is no AI at the moment
              if (sphereIds.length === 1) {
                if (Util.data.getUserLevelInSphere(this.props.state, sphereIds[0]) === 'admin' && !this.props.state.spheres[sphereIds[0]].config.aiSex) {
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
            <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ Languages.text("TutorialDevices", "Got_it_")() }</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
    )
  }
}
