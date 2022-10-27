import * as React from "react";
import { screenWidth } from "../../styles";
import { Svg } from "react-native-svg";
import {
  BarGraphTimeAxis_Hours,
  BarGraphTimeAxis_Month,
  BarGraphTimeAxis_Week,
  BarGraphTimeAxis_Year
} from "./svg/BarGraphTimeAxis";
import { BarGraphDataAxisSvg } from "./svg/BarGraphDataAxis";
import { BarGraphDataSvg } from "./svg/BarGraphData";


export function EnergyGraphAxisSvg(props : {data: EnergyData | null, height: number, width?:number, type: GRAPH_TYPE}) {
  let dataSpacing     = 10;  // space between max data value and top of axis;
  let dataTextSpacing = 6;  // space between data values and axis
  let dataTextWidth   = 25; // width of the textAreas of the data values on the dataAxis

  let timeTextHeight  = 14;

  let width           = (props.width ?? screenWidth) - dataTextWidth - dataTextSpacing;
  let height          = props.height - timeTextHeight;
  let xStart          = dataTextWidth + dataTextSpacing;
  let xEnd            = props.width;
  let yStart          = 10; // area on top reserved for unit information etc.
  let yEnd            = props.height;
  let valueMaxHeight  = height - yStart - dataSpacing;
  let valueFillFactor = 0.85;

  let dimensions = {width, height, xStart, xEnd, yStart, yEnd};

  let maxValue = getMaxValue(props.data);

  let timeAxis;
  switch (props.type) {
    case "DAY":
      timeAxis = <BarGraphTimeAxis_Hours {...dimensions} textHeight={timeTextHeight} data={props.data}/>; break;
    case "WEEK":
      timeAxis = <BarGraphTimeAxis_Week  {...dimensions} textHeight={timeTextHeight} data={props.data}/>;
      valueFillFactor = 0.4;
      break;
    case "MONTH":
      timeAxis = <BarGraphTimeAxis_Month {...dimensions} textHeight={timeTextHeight} data={props.data}/>; break;
    case "YEAR":
      timeAxis = <BarGraphTimeAxis_Year  {...dimensions} textHeight={timeTextHeight} data={props.data}/>; break;
  }


  return (
    <Svg width={props.width} height={props.height}>
      <BarGraphDataAxisSvg
        {...dimensions}
        textWidth={dataTextWidth}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
        spacing={dataSpacing}
      />
      {timeAxis}
      <BarGraphDataSvg
        {...dimensions}
        data={props.data}
        valueFillFactor={valueFillFactor}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
        callback={(index, locationId) => { console.log("Tapped hour", index, "room", locationId)}}
      />
    </Svg>
  )
}




function getMaxValue(data: EnergyData | null) : number {
  if (!data) { return 0}

  let max = -Infinity;
  for (let set of data.data) {
    let sum = 0;
    for (let itemId in set) {
      sum += set[itemId];
    }
    max = Math.max(max, sum);
  }

  return max;
}


