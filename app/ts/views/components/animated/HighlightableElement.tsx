import {useEffect, useRef} from "react";
import { Animated, FlexAlignType, View, Text } from "react-native";
import * as React from "react";
import { colors } from "../../styles";

export function HighlightableElement(props: {elements: JSX.Element[], width: number, height: number, enabled?: boolean, alignment?: FlexAlignType, jiggle?: boolean, quick?: boolean, badge?: BadgeIndicator, badgeColor?: string}) {
  const opacity1Value = useRef(new Animated.Value(1));
  const opacity2Value = useRef(new Animated.Value(0));
  const opacity3Value = useRef(new Animated.Value(0));
  const scale         = useRef(new Animated.Value(1));
  const rotation      = useRef(new Animated.Value(0));

  let useNativeDriver = true;

  useEffect(() => {
    // set everything back to default
    if (!props.enabled) {
      opacity1Value.current.setValue(1);
      opacity2Value.current.setValue(0);
      opacity3Value.current.setValue(0);
      scale.current.setValue(1);
      rotation.current.setValue(0);
      return;
    }

    // set an interval and clear it after the component is unmounted
    let timeout;
    let timeout2;

    let step = 300;
    let speed = 3;
    let bounciness = 1;

    function showElement1() {
      let animations = [
        Animated.spring(opacity1Value.current, {toValue: 1, useNativeDriver, speed, bounciness}),
        Animated.spring(opacity2Value.current, {toValue: 0, useNativeDriver, speed, bounciness}),
        Animated.spring(opacity3Value.current, {toValue: 0, useNativeDriver, speed, bounciness}),
      ];

      if (props.jiggle !== false) {
        animations.push(Animated.spring(scale.current,   {toValue: 1, useNativeDriver, speed, bounciness}));
        animations.push(Animated.spring(rotation.current,{toValue: 0, useNativeDriver, speed: 100, bounciness: 30}))
      }
      Animated.parallel(animations).start();
    }

    function showElement2() {
      let animations = [
        Animated.spring(opacity1Value.current, {toValue: 0,   useNativeDriver, speed, bounciness}),
        Animated.spring(opacity2Value.current, {toValue: 1,   useNativeDriver, speed, bounciness}),
        Animated.spring(opacity3Value.current, {toValue: 0,   useNativeDriver, speed, bounciness}),
      ];
      if (props.jiggle !== false) {
        animations.push(Animated.spring(scale.current,         {toValue: 1.3, useNativeDriver, speed, bounciness}));
        animations.push(Animated.spring(rotation.current,{toValue: 1, useNativeDriver, speed: 100, bounciness: 30}));
      }

      Animated.parallel(animations).start();
    }

    function showElement3() {
      let animations = [
        Animated.spring(opacity1Value.current, {toValue: 0,   useNativeDriver, speed, bounciness}),
        Animated.spring(opacity2Value.current, {toValue: 0,   useNativeDriver, speed, bounciness}),
        Animated.spring(opacity3Value.current, {toValue: 1,   useNativeDriver, speed, bounciness}),
      ];

      if (props.jiggle !== false) {
        animations.push(Animated.spring(scale.current,   {toValue: 0.6, useNativeDriver, speed, bounciness}));
        animations.push(Animated.spring(rotation.current,{toValue: -1, useNativeDriver, speed: 100, bounciness: 30}),)
      }
      Animated.parallel(animations).start();
    }

    function executeAnimation() {
      showElement2();

      // set a timeout to turn the other way
      timeout = setTimeout(() => { showElement3(); }, step);

      // show the original element again
      timeout2 = setTimeout(() => { showElement1(); }, 2 * step);
    }


    const interval = setInterval(() => { executeAnimation(); }, props.quick ? 4*step : 2000);

    executeAnimation();
    // cleanup the timeouts and interval on unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [props.enabled]);

  const spin = rotation.current.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg']
  })

  return (
    <Animated.View style={{width: props.width, height:props.height, transform: [{scale: scale.current},{rotate: spin}] }}>
      <Animated.View style={{position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems: props.alignment, opacity: opacity1Value.current}}>
        {props.elements[0]}
      </Animated.View>
      { props.enabled && <Animated.View style={{position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems: props.alignment, opacity: opacity2Value.current}}>
        {props.elements[1]}
      </Animated.View> }
      { props.enabled && <Animated.View style={{position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems: props.alignment, opacity: opacity3Value.current}}>
        {props.elements[2]}
      </Animated.View>
      }
      <Badge indicator={props.badge} color={props.badgeColor ?? colors.red.hex}/>
    </Animated.View>
  );
}


function Badge(props:{indicator: BadgeIndicator, color: string}) {
  if (props.indicator === 0 || props.indicator === undefined || props.indicator === false || props.indicator === null) {
    return <React.Fragment />;
  }
  let size = 15;
  return (
    <View style={{position: 'absolute', top: -size/4, right: -size/2.5, width:size, height: size, alignItems:'center', justifyContent:'center', backgroundColor: props.color, borderRadius: 0.5*size}}>
      {props.indicator !== true && <Text style={{color: 'white', fontSize: 10, fontWeight:'bold'}}>{props.indicator}</Text>}
    </View>  
  );
}
