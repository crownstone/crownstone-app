import {Languages} from "../../Languages"
import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import {Get} from "../../util/GetUtil";
import { LiveComponent } from "../LiveComponent";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";
import { background, colors, screenHeight, screenWidth, styles } from "../styles";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Button } from "../components/Button";
import { TrainingData } from "./trainingComponents/TrainingData";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}

export class RoomTrainingStep1_train extends LiveComponent<any, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true});
  }

  trainingData

  constructor(props) {
    super(props);
    this.state = {};

    this.trainingData = new TrainingData(this.props.sphereId, this.props.locationId);

    this.trainingData.tick = () => {
      let pattern = [0, 400]
      // Vibration.vibrate(pattern, false);
    }

  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
    }
  }

  componentDidMount() {
    this.trainingData.start();
  }

  componentWillUnmount() {
    this.trainingData.stop();
  }




  render() {
    let location = Get.location(this.props.sphereId, this.props.locationId);
    return (
      <Background hasNavBar={false} image={background.main}>
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.header}>{"Listening..."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!."}</Text>
      </Background>
    );
  }
}

