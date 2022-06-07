import { DataStep } from "../../../components/graph/GraphComponents/DataStep";
import { Line, Text } from "react-native-svg";
import { colors } from "../../../styles";
import * as React from "react";
import { BarGraphDataSvg } from "./BarGraphData";

interface BarGraphDataProps {
  width: number,
  height: number,
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number,
  textColor?: string,
  axisColor?: string,
  axisMajorColor?: string,
  axisMinorColor?: string,

  maxValue: number,
  valueMaxHeight: number,
  spacing: number,
  textWidth: number,
}

export function BarGraphDataAxisSvg(props: BarGraphDataProps) {
  let dataValues = [];

  let unit = 'Wh';
  let scalingFactor = 1;
  if (props.maxValue > 1000) {
    scalingFactor = 0.001;
    unit = 'kWh';
  }

  let dataTextHeight  = 8; // height of a data

  let dataStep = new DataStep(0, props.maxValue*scalingFactor, props.valueMaxHeight, dataTextHeight);
  let lines    = dataStep.getLines();

  let dataTextCount = lines.length;
  let dataTextStep  = (props.height-props.yStart) / (dataTextCount-1);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let height = line.y + props.yStart + props.spacing;

    // do not draw above the yAxis
    if (height < props.yStart) { continue; }

    if (line.major) {
      dataValues.push(
        <Text
          key={`dataAxis-${i}`}
          x={props.textWidth} y={height + 0.5 * dataTextHeight}
          fontSize={10}
          fill={props.textColor ?? colors.black.rgba(0.3)}
          textAnchor="end"
          textLength={props.textWidth}
        >{lines[i].val}</Text>
      );
    }

    dataValues.push(
      <Line
        key={'dataAxis'}
        x1={props.xStart} y1={height} x2={props.width} y2={height}
        stroke={
          line.major ?
            props.axisMajorColor ?? colors.black.rgba(0.10) :
            props.axisMinorColor ?? colors.black.rgba(0.03)
        }
      />
    );
  }

  return (
    <React.Fragment>
      <Text
        x={props.textWidth}
        y={props.yStart}
        fontSize={10}
        fill={props.textColor ?? colors.black.rgba(0.3)}
        textAnchor={'end'}
        textLength={props.textWidth}
      >{unit}</Text>
      { dataValues }
      <Line
        key={'dataAxis'}
        x1={props.xStart} y1={props.height} x2={props.xStart} y2={props.yStart}
        stroke={props.axisColor ?? colors.black.rgba(0.3)}
      />
    </React.Fragment>
  );
}
