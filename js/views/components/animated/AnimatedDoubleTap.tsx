import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import {Icon} from "../Icon";
import {colors} from "../../styles";

export class AnimatedDoubleTap extends Component<any, any> {
  unsubscribe : any;
  animating = false;


  constructor(props) {
    super(props);

    this.state = {
      iconTopOffset: new Animated.Value(20),
      oneOpacity: new Animated.Value(0),
      twoOpacity: new Animated.Value(0),
      iconOpacity: new Animated.Value(0),
      firstTapOpacity: new Animated.Value(0),
      firstTapSize: new Animated.Value(1),
      secondTapOpacity: new Animated.Value(0),
      secondTapSize: new Animated.Value(1),
    };
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("showDoubleTapGesture", () => { this.animateDoubleTap(); });
  }
  componentWillUnmount() {
    this.unsubscribe();
  }

  animateDoubleTap() {
    // do not animate if already animating
    if (this.animating) {
      return;
    }

    this.state.iconTopOffset.setValue(20);
    this.state.iconOpacity.setValue(0);
    this.state.oneOpacity.setValue(0);
    this.state.twoOpacity.setValue(0);
    this.state.firstTapOpacity.setValue(0);
    this.state.firstTapSize.setValue(1);
    this.state.secondTapOpacity.setValue(0);
    this.state.secondTapSize.setValue(1);

    this.animating = true;
    let iconAnimations = [];
    iconAnimations.push(
      Animated.parallel([
        Animated.timing(this.state.iconOpacity, { toValue: 1, duration: 300}),
        Animated.timing(this.state.iconTopOffset, { toValue: 0, duration: 300}),
        Animated.timing(this.state.oneOpacity, { toValue: 1, delay:150, duration: 150}),
      ])
    );
    iconAnimations.push(
      Animated.parallel([
        Animated.timing(this.state.iconTopOffset, { toValue: 10, duration: 200}),
        Animated.timing(this.state.oneOpacity, { toValue: 0, delay:150, duration: 50}),
      ])
    );
    iconAnimations.push(
      Animated.parallel([
        Animated.timing(this.state.iconTopOffset, { toValue: 0, duration: 200}),
        Animated.timing(this.state.twoOpacity, { toValue: 1, delay:50, duration: 150}),
      ])
    );
    iconAnimations.push(
      Animated.parallel([
        Animated.timing(this.state.iconTopOffset, { toValue: 20, duration: 200}),
        Animated.timing(this.state.iconOpacity, { toValue: 0, duration: 200}),
        Animated.timing(this.state.twoOpacity, { toValue: 0, duration: 1000}),
      ])
    );

    let firstTapAnimations = [];
    firstTapAnimations.push(Animated.timing(this.state.firstTapOpacity, { toValue: 1, delay:200, duration: 50}));
    firstTapAnimations.push(Animated.timing(this.state.firstTapOpacity, { toValue: 0, delay:100, duration: 500}));

    let secondTapAnimations = [];
    secondTapAnimations.push(Animated.timing(this.state.secondTapOpacity, { toValue: 1, delay: 650, duration: 150}));
    secondTapAnimations.push(Animated.timing(this.state.secondTapOpacity, { toValue: 0, delay: 0, duration: 400}));

    Animated.parallel([
      Animated.sequence(iconAnimations),
      Animated.sequence(firstTapAnimations),
      Animated.sequence(secondTapAnimations),
      Animated.timing(this.state.firstTapSize,  { toValue: 100, delay:200, duration: 700}),
      Animated.timing(this.state.secondTapSize, { toValue: 300, delay:650, duration: 700})
    ]).start(() => { this.animating = false; })

  }

  render() {
    let base = {width: this.props.width, height: this.props.height, backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, justifyContent: 'center', alignItems:'center', overflow:'hidden'};
    let textStyle = {fontSize: 25, color: colors.white.hex, fontWeight: 'bold', position:'relative', top: -40, left:35, fontStyle:'italic'};
    return (
      <View style={base}>
        <Animated.View style={[base, {opacity: this.state.oneOpacity}]}>
          <Text style={textStyle}>1 x..</Text>
        </Animated.View>
        <Animated.View style={[base, {opacity: this.state.twoOpacity}]}>
          <Text style={[textStyle, {top:-35, left: 43}]}>2 x!</Text>
        </Animated.View>
        <Animated.View style={[base, {opacity: this.state.firstTapOpacity}]}>
          <Animated.View style={{width:this.state.firstTapSize, height: this.state.firstTapSize,  borderRadius: this.state.firstTapSize, backgroundColor: 'transparent', borderWidth: 5, borderColor: colors.white.rgba(0.75), position:'relative', left:-8, top:-50}} />
        </Animated.View>
        <Animated.View style={[base, {opacity: this.state.secondTapOpacity}]}>
          <Animated.View style={{width:this.state.secondTapSize, height:this.state.secondTapSize, borderRadius: this.state.secondTapSize, backgroundColor: 'transparent', borderWidth: 3, borderColor: colors.white.rgba(0.9), position:'relative', left:-8, top:-50}} />
        </Animated.View>
        <Animated.View style={[base, {opacity: this.state.iconOpacity, top: this.state.iconTopOffset}]}>
          <Icon name='c1-tap-block' size={100} color={colors.white.hex} />
        </Animated.View>
      </View>
    )
  }
}
