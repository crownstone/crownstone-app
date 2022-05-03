import {Languages} from "../../Languages"
import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import {Get} from "../../util/GetUtil";
import { LiveComponent } from "../LiveComponent";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";
import { background, colors, screenHeight, screenWidth, styles } from "../styles";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Button } from "../components/Button";
import { TrainingData } from "./trainingComponents/TrainingData";
import { core } from "../../Core";
import { Bluenet } from "../../native/libInterface/Bluenet";
import { Component } from "react";
import {
  Svg,
  Line, Circle
} from "react-native-svg";
import { TOPICS } from "../../Topics";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}

export const MIN_DATA_COUNT = 10;

export class RoomTrainingStep1_train extends LiveComponent<any, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true});
  }

  trainingData : TrainingData;
  unsubscribe = [];



  constructor(props) {
    super(props);
    this.state = {
      showMoveAround: false,
      distance: 0,
      dataCount:0
    };

    this.trainingData = new TrainingData(this.props.sphereId, this.props.locationId);

    this.trainingData.tick = (amountOfPoints) => {
      this.setState({dataCount: amountOfPoints});

      if (Platform.OS === "android") {
        let pattern = [50,0,30]
        Vibration.vibrate(pattern);
      }
      else {
        Bluenet.vibrate("success");
      }

      if (amountOfPoints === MIN_DATA_COUNT) {
        Vibration.vibrate([400])
        return;
      }
    }

  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this.trainingData.abort();
    }
  }

  componentDidMount() {
    this.trainingData.start();
  }

  componentWillUnmount() {
    this.trainingData.stop();
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  render() {
    let location = Get.location(this.props.sphereId, this.props.locationId);
    let size = Math.min(screenWidth, 0.35*screenHeight);
    return (
      <Background hasNavBar={false} image={background.main} hideNotifications={true}>
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.header}>{"Listening..."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>



        { this.state.dataCount < MIN_DATA_COUNT  && <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!"}</Text>}
        { this.state.dataCount < MIN_DATA_COUNT  && <Text style={styles.header}>{`(${this.state.dataCount} / ${MIN_DATA_COUNT})`}</Text>}

        { this.state.dataCount >= MIN_DATA_COUNT && <Text style={styles.explanation}>{"You can collect more if you want. The more the better!"}</Text>}
        { this.state.dataCount >= MIN_DATA_COUNT && <Text style={{...styles.header, color: colors.green.hex}}>{`Collected ${this.state.dataCount} points so far!`}</Text>}

        <View style={{flex:1}}/>

        { this.state.dataCount >= MIN_DATA_COUNT && <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            icon={'ios-play'}
            label={ "Finish!"}
            callback={() => {

              NavigationUtil.navigate('RoomTrainingStep2_train', this.props);
            }}
          />
        </View>}
      </Background>
    );
  }
}

// class Viz extends Component<any, any> {
//
//   constructor(props) {
//     super(props);
//   }
//
//
//   render() {
//     let maxR = this.props.size/2;
//     let amountOfCrownstones = this.props.crownstones.length;
//
//     let dots  = [];
//     let lines = [];
//     let axis  = {};
//     let increments = (Math.PI*2)/amountOfCrownstones;
//     let min = getDistanceFromRssi(-40);
//     let max = getDistanceFromRssi(-95);
//     let range = max - min;
//
//     let [r,rNext] = [0,0]
//
//     function map(value = 0, j) {
//       if (value === 0) {
//         r = 0;
//       }
//       else {
//         value = getDistanceFromRssi(value)
//         value = Math.min(max, value); // -10 ... -90
//         value = Math.max(min, value); // -40 ... -90
//         value -= min; // 0 ... -50
//         value /= range // 0 ... 1
//         value = 1 - value; // 1...0
//
//         r = maxR*(value*0.75+0.25)
//       }
//
//
//       let x = Math.round(r*Math.cos(j*increments) + maxR);
//       let y = Math.round(r*Math.sin(j*increments) + maxR);
//       return [x,y];
//     }
//
//     for (let i = 0; i < this.props.data.length; i++) {
//       let sample = this.props.data[i].devices;
//
//
//       for (let j = 0; j < amountOfCrownstones; j++) {
//         let id = this.props.crownstones[j];
//         let k = (j+1)%amountOfCrownstones;
//
//         let idNext = this.props.crownstones[k];
//         let [x,y] = map(sample[id],j)
//
//
//         let opacity = Math.max(0.1,(1/this.props.data.length));
//
//         if (sample[id]) {
//           if (i === this.props.data.length -1) {
//             lines.push(<Line key={`${id}_${i}`} x1={x} y1={y} x2={maxR} y2={maxR} stroke={colors.green.hex} strokeOpacity={1} strokeWidth={3} strokeLinecap={'round'} />);
//             dots.push(<Circle cx={x} cy={y} r={4} fill={colors.green.hex} fillOpacity={1} />)
//           }
//           else {
//             lines.push(<Line key={`${id}_${i}`} x1={x} y1={y} x2={maxR} y2={maxR} stroke={colors.csBlue.hex} strokeOpacity={opacity}  strokeWidth={7} strokeLinecap={'round'} />);
//             dots.push(<Circle cx={x} cy={y} r={6} fill={colors.csBlue.hex} fillOpacity={opacity} />)
//           }
//         }
//
//
//         if (axis[id] === undefined) {
//           let axis_x = Math.round(maxR * Math.cos(j * increments) + maxR);
//           let axis_y = Math.round(maxR * Math.sin(j * increments) + maxR);
//           let axis_xn = Math.round(maxR*0.1 * Math.cos(j * increments) + maxR);
//           let axis_yn = Math.round(maxR*0.1 * Math.sin(j * increments) + maxR);
//           axis[id] =<Line key={`${id}axis`} x1={axis_x} y1={axis_y} x2={axis_xn} y2={axis_yn} stroke={colors.lightGray.hex} strokeOpacity={1} strokeWidth={3} strokeLinecap={'round'} />;
//         }
//       }
//     }
//
//
//     return (
//       <Svg
//         width={this.props.size}
//         height={this.props.size}
//       >
//         {Object.values(axis)}
//         {dots}
//       </Svg>
//     )
//   }
// }
//
// function getDistanceFromRssi(rssi) {
//   let distance = Math.pow(10,(rssi - -50)/(-10 * 4));
//   return distance;
// }
