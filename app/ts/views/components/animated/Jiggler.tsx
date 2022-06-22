import {useEffect, useRef} from "react";
import {Animated} from "react-native";
import * as React from "react";

// a wrapper that will jiggle the icons
export function Jiggler(props) {
  const rotationValue = useRef(new Animated.Value(0));

  useEffect(() => {
    if (!props.enabled) return;

    // set an interval and clear it after the component is unmounted
    let timeout;
    let timeout2;
    let speed = 100;
    let bounciness = 30;
    const interval = setInterval(() => {
      Animated.spring(rotationValue.current, { toValue: 1, speed, bounciness, useNativeDriver: props.useNativeDriver ?? true}).start();
      // set a timeout to turn the other way
      timeout = setTimeout(() => {  Animated.spring(rotationValue.current, { toValue: -1, speed, bounciness, useNativeDriver: props.useNativeDriver ?? true}).start(); }, 100);
      timeout2 = setTimeout(() => {  Animated.spring(rotationValue.current, { toValue: 0, speed, bounciness, useNativeDriver: props.useNativeDriver ?? true}).start(); }, 300);
    }, 1600);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [props.enabled]);

  const spin = rotationValue.current.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg']
  })

  return (
    <Animated.View style={{transform: [{rotate: spin}] }}>{props.children}</Animated.View>
  )
}
