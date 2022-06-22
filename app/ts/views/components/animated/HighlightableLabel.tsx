import {colors} from "../../styles";
import * as React from "react";
import {HighlightableElement} from "./HighlightableElement";
import {FlexAlignType, Text, TextStyle} from "react-native";

export function HighlightableLabel(props: {colorArray?: string[], enabled: boolean, style?: TextStyle, label: string, width:number, height: number, align?: FlexAlignType, quick?: boolean}) {
  const usedColorArray = [
    colors.white.hex,
    (props.colorArray && props.colorArray[0]) ?? colors.csOrange.hex,
    (props.colorArray && props.colorArray[1]) ?? colors.blue.hex,
  ];

  const elements = [
    <Text style={{...(props.style ?? {}), color: usedColorArray[0]}}>{props.label}</Text>,
    <Text style={{...(props.style ?? {}), color: usedColorArray[1]}}>{props.label}</Text>,
    <Text style={{...(props.style ?? {}), color: usedColorArray[2]}}>{props.label}</Text>,
  ];
  return (
    <HighlightableElement {...props} elements={elements} width={props.width} height={props.height} alignment={props.align ?? 'flex-start'} jiggle={false} quick={props.quick}/>
  );
}
