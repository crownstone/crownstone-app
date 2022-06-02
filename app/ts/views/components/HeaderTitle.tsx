import { Text } from "react-native";
import { styles } from "../styles";
import * as React from "react";


export function HeaderTitle(props: {lightBackground?: boolean, title:string, maxWidth?:number}) {
  let style = props.lightBackground ? styles.viewHeaderLight : styles.viewHeader;
  if (props.maxWidth) {
    style = {...style, maxWidth:props.maxWidth};
  }
  return (
    <Text
      style={style}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.65}
    >
      {props.title}
    </Text>
  );
}


