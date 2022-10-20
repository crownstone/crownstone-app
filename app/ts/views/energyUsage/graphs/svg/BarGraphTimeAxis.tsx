import { Line, Text } from "react-native-svg";
import * as React from "react";
import { colors, screenWidth } from "../../../styles";
import { BarGraphDataSvg } from "./BarGraphData";
import {
  DAY_INDICES_SUNDAY_START,
  DAY_SHORT_LABEL_MAP,
  MONTH_INDICES,
  MONTH_SHORT_LABEL_MAP
} from "../../../../Constants";

interface BarGraphTimeProps_Preconfigured {
  width: number,
  height: number,
  xStart: number,
  xEnd: number,
  yEnd: number,
  data: EnergyData | null,
  textHeight: number,
  textColor?: string,
  axisColor?: string,
}


interface BarGraphTimeProps extends BarGraphTimeProps_Preconfigured {
  amountOfValues: number,
  label: (value: number) => string | null;
}


export function BarGraphTimeAxis_Hours(props: BarGraphTimeProps_Preconfigured) {
  return (
    <BarGraphTimeAxisSvg
      {...props}
      amountOfValues={24}
      label={(value) => {
        if (value % 2 !== 0) {
          return null;
        }

        return String(value);
      }}
    />
  )
}

export function BarGraphTimeAxis_Week(props: BarGraphTimeProps_Preconfigured) {
  return (
    <BarGraphTimeAxisSvg
      {...props}
      amountOfValues={7}
      label={(value) => {
        let startTime = props.data?.startTime ?? Date.now();
        let startDay = new Date(startTime).getDay()

        return DAY_SHORT_LABEL_MAP(DAY_INDICES_SUNDAY_START[(startDay+value)%7]);
      }}
    />
  )
}


export function BarGraphTimeAxis_Month(props: BarGraphTimeProps_Preconfigured) {
  return (
    <BarGraphTimeAxisSvg
      {...props}
      amountOfValues={props.data.data.length}
      label={(value) => {
        if (value % 2 !== 0) {
          return null;
        }

        return String(value+1);
      }}
    />
  )
}

export function BarGraphTimeAxis_Year(props: BarGraphTimeProps_Preconfigured) {
  return (
    <BarGraphTimeAxisSvg
      {...props}
      amountOfValues={12}
      label={(value) => {
        return MONTH_SHORT_LABEL_MAP(MONTH_INDICES[value]);
      }}
    />
  )
}

function BarGraphTimeAxisSvg(props: BarGraphTimeProps) {
  let width = props.width;

  let timeValues = [];
  let timeTextWidth  = width/props.amountOfValues;
  let timeTextStep   = width/props.amountOfValues;

  for (let i = 0; i < props.amountOfValues; i++) {
    let label = props.label(i);
    if (label === null) { continue; }

    timeValues.push(
      <Text
        key={`timeAxis-${i}`}
        x={i*timeTextStep + props.xStart + 0.5*timeTextWidth}
        y={props.yEnd-2}
        fontSize={10}
        fill={props.textColor ?? colors.black.rgba(0.3)}
        textAnchor="middle"
        textLength={timeTextWidth}
      >{label}</Text>
    );
  }

  return <React.Fragment>
    <Line
      key={'timeAxis'}
      x1={props.xStart}
      y1={props.yEnd-props.textHeight}
      x2={props.xEnd}
      y2={props.yEnd-props.textHeight}
      stroke={props.axisColor ?? colors.black.rgba(0.3)}
    />
    { timeValues }
  </React.Fragment>
}
