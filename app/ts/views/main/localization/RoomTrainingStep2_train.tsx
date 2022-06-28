import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";
import { Languages } from "../../../Languages";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { TrainingData } from "../../roomViews/trainingComponents/TrainingData";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}

export const MIN_DATA_COUNT = 10;


export function RoomTrainingStep2_train() {
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
