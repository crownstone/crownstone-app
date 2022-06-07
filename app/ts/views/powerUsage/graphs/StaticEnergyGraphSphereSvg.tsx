import { useForceUpdate } from "../../components/hooks/databaseHooks";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { appStyleConstants, colors, screenWidth } from "../../styles";
import { Line, Svg, Rect, Text } from "react-native-svg";
import { DataStep } from "../../components/graph/GraphComponents/DataStep";
import { BarGraphTimeAxis_HoursSvg } from "./svg/BarGraphTimeAxis";
import { BarGraphDataAxisSvg } from "./svg/BarGraphDataAxis";
import { BarGraphDataSvg } from "./svg/BarGraphData";
import { xUtil } from "../../../util/StandAloneUtil";

export function StaticEnergyGraphSphereSvg(props) {
  let forceUpdate = useForceUpdate()
  // let sphere = Get.sphere(props.sphereId);
  //
  //
  //
  return (
    <React.Fragment>
      <View>
        <EnergyGraphAxisSvg width={0.9*screenWidth} height={200}/>
      </View>
    </React.Fragment>
  );
}

function EnergyGraphAxisSvg(props : {height: number, width?:number}) {
  let dataSpacing     = 5;  // space between max data value and top of axis;
  let dataTextSpacing = 6;  // space between data values and axis
  let dataTextWidth   = 22; // width of the textAreas of the data values on the dataAxis


  let timeTextHeight  = 14;

  let width           = (props.width ?? screenWidth) - dataTextWidth - dataTextSpacing;
  let height          = props.height - timeTextHeight;
  let xStart          = dataTextWidth + dataTextSpacing;
  let xEnd            = props.width;
  let yStart          = 20; // area on top reserved for unit information etc.
  let yEnd            = props.height;
  let valueMaxHeight  = height - yStart - dataSpacing;

  let dimensions = {width, height, xStart, xEnd, yStart, yEnd};


  /** Generate Data **/
      let valueCount = 24;
      let std = 4;
      let mean = 12;
      function gaussian(x) {
        let exponent = Math.exp(-(Math.pow(x - mean,2)/(2*Math.pow(std,2))));
        let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * std);
        return stoneProbability;
      }

      let roomCount = 10;

      let rooms = []
      for (let i = 0; i < roomCount; i++) {
        rooms.push(xUtil.getUUID());
      }

      let data = []
      for (let i = 0; i < valueCount; i++) {
        data.push({});
        for (let k = 0; k < roomCount; k++) {
          let value = gaussian(i)*Math.random()*3600+ Math.random()*100;
          data[i][rooms[k]] = value;
        }
      }
  /** end of Generate Data **/

  let maxValue = getMaxValue(data);

  return (
    <Svg width={props.width} height={props.height}>
      <BarGraphDataAxisSvg
        {...dimensions}
        textWidth={dataTextWidth}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
        spacing={dataSpacing}
      />
      <BarGraphTimeAxis_HoursSvg
        {...dimensions}
        textHeight={timeTextHeight}
      />
      <BarGraphDataSvg
        {...dimensions}
        data={data}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
        callback={(index, locationId) => { console.log("Tapped hour", index, "room", locationId)}}
      />
    </Svg>
  )
}




function getMaxValue(data: number[][]) {
  let max = -Infinity;
  for (let set of data) {
    let sum = 0;
    for (let locationId in set) {
      sum += set[locationId];
    }
    max = Math.max(max, sum);
  }
  return max;
}


