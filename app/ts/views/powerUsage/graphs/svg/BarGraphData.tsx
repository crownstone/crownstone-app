import { colors } from "../../../styles";
import { Rect } from "react-native-svg";
import * as React from "react";


const defaultColorList = [
  colors.csBlue,
  colors.csBlueDark,
  colors.csBlueDarker,
  colors.csBlueLight,
  colors.csBlueLighter,
  colors.csBlueLightDesat,
  colors.csOrange,
  colors.lightCsOrange,
  colors.blue,
  colors.blueDark,
  colors.blue3,
  colors.iosBlue,
  colors.iosBlueDark,
  colors.lightBlue,
  colors.lightBlue2,
  colors.blinkColor1,
  colors.blinkColor2,
  colors.green,
  colors.lightGreen2,
  colors.lightGreen,
  colors.green2,
  colors.darkGreen,
  colors.purple,
  colors.darkPurple,
  colors.darkerPurple,
  colors.red,
  colors.darkRed,
  colors.menuRed,
  colors.gray,
  colors.darkGray,
  colors.darkGray2,
  colors.lightGray2,
  colors.lightGray,
]


export function BarGraphDataSvg(props: {data: Record<locationId,number>[],yStart: number, xStart: number, height:number, width:number, maxValue: number, valueMaxHeight: number, callback: (index, locationId) => void}) {
  let values = [];
  let valueFillFactor = 0.8;
  let valueStep = props.width/props.data.length;
  let valueWidth = valueStep * valueFillFactor;

  for (let i = 0; i < props.data.length; i++) {
    values.push(
      <StackedBarValueSvg
        data={props.data[i]}
        x={i*valueStep + props.xStart + 0.5*(valueStep*(1-valueFillFactor))}
        y={props.height}
        width={valueWidth}
        maxHeight={props.valueMaxHeight}
        maxValue={props.maxValue}
        callback={(locationId) => { props.callback(i, locationId); }}
      />
    );
  }

  return <React.Fragment>{values}</React.Fragment>;
}
/**
 * this will return a single stacked column located at props.x, props.y
 * @param props
 * @constructor
 */
function StackedBarValueSvg(props: { data: Record<locationId, number>, x:number, y: number, width:number, maxHeight: number, maxValue: number, callback: (locationId) => void, colors?: color[]}) {
  let colorsUsed = props.colors ?? defaultColorList;
  let data = props.data;
  let stack = [];

  let totalHeight = 0;

  let colorArr = Object.keys(colors);

  let colorIndex = 0;
  for (let locationId in data) {
    let height = (data[locationId] / props.maxValue)*props.maxHeight;

    stack.push(
      <Rect
        x={props.x}
        y={props.y - totalHeight - height}
        width={props.width}
        height={height}
        fill={colorsUsed[colorIndex++%colorsUsed.length].hex}
        strokeWidth={1}
        stroke={colors.black.hex}
        strokeOpacity={0.15}
        rx={1}
        ry={1}
        onPress={() => { props.callback(locationId); }}
      />
    );

    totalHeight += height;
  }

  return <React.Fragment>{stack}</React.Fragment>
}

