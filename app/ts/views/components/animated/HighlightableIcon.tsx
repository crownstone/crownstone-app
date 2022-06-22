import {colors} from "../../styles";
import {Icon} from "../Icon";
import * as React from "react";
import {HighlightableElement} from "./HighlightableElement";

export function HighlightableBlackIcon(props: {size: number, name: string, colorArray?: string[], enabled: boolean, quick?: boolean}) {
  const usedColorArray = [
    colors.black.hex,
    (props.colorArray && props.colorArray[0]) ?? colors.csOrange.hex,
    (props.colorArray && props.colorArray[1]) ?? colors.blue.hex,
  ];

  return <HighlightableIcon {...props} colorArray={usedColorArray} quick={props.quick} />;
}

export function HighlightableWhiteIcon(props: {size: number, name: string, colorArray?: string[], enabled: boolean, quick?: boolean}) {
  const usedColorArray = [
    colors.white.hex,
    (props.colorArray && props.colorArray[0]) ?? colors.csOrange.hex,
    (props.colorArray && props.colorArray[1]) ?? colors.blue.hex,
  ];

  return <HighlightableIcon {...props} colorArray={usedColorArray} quick={props.quick} />;
}

// icon with animated color and pulsing animation
export function HighlightableIcon(props: {size: number, name: string, colorArray?: string[], enabled: boolean, quick?: boolean}) {
  const elements = [
    <Icon name={props.name} size={props.size} color={(props.colorArray && props.colorArray[0]) ?? colors.black.hex} />,
    <Icon name={props.name} size={props.size} color={(props.colorArray && props.colorArray[1]) ?? colors.csOrange.hex} />,
    <Icon name={props.name} size={props.size} color={(props.colorArray && props.colorArray[2]) ?? colors.blue.hex} />,
  ];
  return (
    <HighlightableElement {...props} elements={elements} width={props.size} height={props.size} alignment={"center"} quick={props.quick}/>
  );
}