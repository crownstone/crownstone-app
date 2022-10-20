import { colors } from "../../../styles";
import { Rect } from "react-native-svg";
import * as React from "react";


export function BarGraphDataSvg(props: {data: EnergyData | null,yStart: number, xStart: number, height:number, width:number, maxValue: number, valueMaxHeight: number, valueFillFactor: number, callback: (index, locationId) => void}) {
  let values = [];

  if (props.data && props.maxValue > 0) {
    let valueStep = props.width/props.data.data.length;
    let valueWidth = valueStep * props.valueFillFactor;

    for (let i = 0; i < props.data.data.length; i++) {
      values.push(
        <StackedBarValueSvg
          data={props.data.data[i]}
          colorMap={props.data.colorMap}
          x={i*valueStep + props.xStart + 0.5*(valueStep*(1-props.valueFillFactor))}
          y={props.height}
          width={valueWidth}
          maxHeight={props.valueMaxHeight}
          maxValue={props.maxValue}
          callback={(locationId) => { props.callback(i, locationId); }}
        />
      );
    }
  }

  return <React.Fragment>{values}</React.Fragment>;
}
/**
 * this will return a single stacked column located at props.x, props.y
 * @param props
 * @constructor
 */
function StackedBarValueSvg(props: { data: Record<itemId, number>, colorMap: Record<itemId, string>, x:number, y: number, width:number, maxHeight: number, maxValue: number, callback: (locationId) => void, colors?: color[]}) {
  let data = props.data;
  let stack = [];
  let totalHeight = 0;

  for (let itemId in data) {
    let height = (data[itemId] / props.maxValue)*props.maxHeight;

    stack.push(
      <Rect
        x={props.x}
        y={props.y - totalHeight - height}
        width={props.width}
        height={height}
        fill={props.colorMap[itemId]}
        strokeWidth={1}
        stroke={colors.black.hex}
        strokeOpacity={0.15}
        rx={1}
        ry={1}
        onPress={() => { props.callback(itemId); }}
      />
    );

    totalHeight += height;
  }

  return <React.Fragment>{stack}</React.Fragment>
}

