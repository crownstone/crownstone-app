import {BlurView} from "@react-native-community/blur";
import * as React from 'react';
import {
  Platform,
  View
} from "react-native";


export function Blur(props) {
  if (Platform.OS === 'android') {
    let nestedProps = {...props}
    if (props?.style) {
      if (Array.isArray(props.style)) {
        let mergedStyle = {};
        for (let i = 0; i < props.style.length; i++) {
          mergedStyle = {...mergedStyle, ...props.style[i]}
        }
        nestedProps.style = mergedStyle;
      }
    }
    if (props?.style?.backgroundColor === undefined) {
      if (props?.blurType === "light") {
        nestedProps.style = {...(nestedProps.style ?? {}), backgroundColor: 'rgba(255,255,255,0.6)'}
      }
      else if (props.blurType === 'dark') {
        nestedProps.style = {...(nestedProps.style ?? {}), backgroundColor: 'rgba(0,0,0,0.6)'}
      }
    }

    return <View {...nestedProps} />
  }

  return <BlurView {...props} />;
}
