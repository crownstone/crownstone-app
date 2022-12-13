
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_training", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Platform, Vibration, Text, View, ViewStyle, Animated } from "react-native";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { Background } from "../../components/Background";
import { colors, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import {FINGERPRINT_SIZE_THRESHOLD, FingerprintUtil} from "../../../util/FingerprintUtil";
import {core} from "../../../Core";
import { FingerprintCollector } from "../../../localization/fingerprints/FingerprintCollector";
import { Component } from "react";
import { ProgressCircle } from "../../components/ProgressCircle";
import { SlideInView } from "../../components/animated/SlideInView";
import { ScaledImage } from "../../components/ScaledImage";



export class RoomTraining_training extends LiveComponent<{ sphereId: sphereId, locationId: locationId, type: FingerprintType, componentId: string, minRequiredSamples?: number}, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: lang("Locating_the_",location.config.name), cancel: true});
  }

  trainingData : FingerprintCollector;
  minRequiredSamples : number = FINGERPRINT_SIZE_THRESHOLD;

  constructor(props) {
    super(props);

    if (this.props.minRequiredSamples) {
      this.minRequiredSamples = this.props.minRequiredSamples;
    }

    this.state = {
      showMoveAround: false,
      distance: 0,
      dataCount:0
    };

    this.trainingData = new FingerprintCollector(this.props.sphereId, this.props.locationId, this.props.type);

    this.trainingData.tick = (amountOfPoints) => {
      this.setState({dataCount: amountOfPoints});

      if (amountOfPoints === this.minRequiredSamples) {
        if (Platform.OS === 'android') {
          Vibration.vibrate([0,400]);
        }
        else {
          Vibration.vibrate([0]);
        }
        return;
      }

      if (Platform.OS === "android") {
        let pattern = [0,50,10,30]
        Vibration.vibrate(pattern);
      }
      else {
        Bluenet.vibrate("success");
      }
    }
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this.trainingData.stop();
      NavigationUtil.back();
    }
  }

  componentDidMount() {
    this.trainingData.start();
  }

  componentWillUnmount() {
    this.trainingData.stop();
  }

  render() {
    return (
      <Background>
        <View style={{height: topBarHeight}} />
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.header}>{ lang("Listening___") }</Text>
        <Text style={styles.boldExplanation}>{ lang("Move_around_the_room_to_c") }</Text>

        <TrainingAnimation count={this.state.dataCount} requiredAmount={this.minRequiredSamples} />

        { this.state.dataCount < this.minRequiredSamples  && <Text style={styles.explanation}>{ lang("Once_I_have_collected_eno") }</Text>}
        { this.state.dataCount >= this.minRequiredSamples && <Text style={styles.explanation}>{ lang("You_can_collect_more_if_y") }</Text>}

        <View style={{flex:1}}/>

        <SlideInView visible={this.state.dataCount < this.minRequiredSamples} duration={200} height={60+65} />
        <SlideInView visible={this.state.dataCount >= this.minRequiredSamples} duration={200} height={60+65}>
          <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
            <Button
              backgroundColor={colors.green.hex}
              label={ lang("Finish_")}
              callback={() => {
                this.trainingData.stop();

                // if we train the in-hand type of fingerprint, we can delete the other types.
                // the in-hand fingerprints are a sort of baseline, whereas the in-pocket type is additional.
                if (this.props.type === 'IN_HAND') {
                  FingerprintUtil.checkAndRemoveBadFingerprints(this.props.sphereId, this.props.locationId);
                }

                if (this.state.dataCount >= this.minRequiredSamples) {
                  this.trainingData.store();
                }
                NavigationUtil.navigate('RoomTraining_conclusion', this.props);
              }}
            />
          </View>
        </SlideInView>
      </Background>
    );
  }
}


class TrainingAnimation extends Component<{count: number, requiredAmount: number}, any> {

  render() {
    let borderWidth = 20;
    let size = 0.6*screenWidth;
    let finished = this.props.count >= this.props.requiredAmount;

    let steps = [
      10,
      25,
      40,
      60,
      90,
    ]

    let text = lang("Lets_get_more_");
    let stars = 0;
    let count = this.props.count - this.props.requiredAmount;
    if (finished) {
           if (count >= steps[4]) { text = lang("SO___MANY___n_DATAPOINTS_"); }
      else if (count >= steps[3]) { text = lang("Lets_do_more_"); }
      else if (count >= steps[2]) { text = lang("Youre_doing_nGREAT_"); }
      else if (count >= steps[1]) { text = lang("Make_sure_you_nget_it_all"); }
      else if (count >= steps[0]) { text = lang("Youre_doing_nGREAT_"); }

      for (let step of steps) {
        if (this.props.count >= this.props.requiredAmount + step) { stars++; }
      }
    }


    let angles = [
      0.28*Math.PI,
      0.39*Math.PI,
      0.5*Math.PI,
      0.61*Math.PI,
      0.72*Math.PI,
    ];
    let starSize = 40;

    return (
      <View style={{flexGrow: 1, width: screenWidth, ...styles.centered, height: size+starSize}}>
        <View style={{height: size, width: size, ...styles.centered }}>
          <ProgressCircle
            radius={0.5*size}
            borderWidth={borderWidth}
            color={colors.black.rgba(0.05)}
            progress={1}
            absolute
          />
          <ProgressCircle
            radius={0.5*size}
            borderWidth={borderWidth}
            color={finished ? colors.green.hex : colors.blue.hex}
            progress={(this.props.count)/this.props.requiredAmount}
            absolute
          />
          { !finished && <Text style={{color: colors.blue.hex, fontSize: 25, fontWeight: 'bold'}}>{`${this.props.count} / ${this.props.requiredAmount}`}</Text> }
          { finished  && <Text style={{color: colors.green.hex, fontSize: 40, fontWeight: 'bold'}}>{this.props.count}</Text> }
          { finished  && <Text style={{color: colors.green.hex, fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{text}</Text> }
          { (stars > 0) && <Star containerSize={size} angle={angles[0]} count={this.props.count}/> }
          { (stars > 1) && <Star containerSize={size} angle={angles[1]} count={this.props.count}/> }
          { (stars > 2) && <Star containerSize={size} angle={angles[2]} count={this.props.count}/> }
          { (stars > 3) && <Star containerSize={size} angle={angles[3]} count={this.props.count}/> }
          { (stars > 4) && <Star containerSize={size} angle={angles[4]} count={this.props.count}/> }
        </View>
      </View>
    )
  }
}

function limit(value) {
  return Math.min(1, Math.max(0, value));
}

class Star extends Component<any, any> {
  initialized = false;


  constructor(props) {
    super(props);

    this.state = {
      angle: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }
  }

  componentDidMount() {
    let rotationAnimations = [];
    let scaleAnimations = [];
    rotationAnimations.push(Animated.timing(this.state.angle, {
      toValue:  0.5,
      delay:    0,
      duration: 100,
      useNativeDriver: true
    }));
    rotationAnimations.push(Animated.timing(this.state.angle, {
      toValue:  -0.5,
      delay:    0,
      duration: 100,
      useNativeDriver: true
    }));
    rotationAnimations.push(Animated.timing(this.state.angle, {
      toValue:  0,
      delay:    0,
      duration: 50,
      useNativeDriver: true
    }));
    scaleAnimations.push(Animated.timing(this.state.scale, {
      toValue:  1.25,
      delay:    0,
      duration: 100,
      useNativeDriver: true
    }));
    scaleAnimations.push(Animated.timing(this.state.scale, {
      toValue:  0.9,
      delay:    100,
      duration: 100,
      useNativeDriver: true
    }));
    scaleAnimations.push(Animated.timing(this.state.scale, {
      toValue:  1,
      delay:    0,
      duration: 50,
      useNativeDriver: true
    }));

    Animated.parallel([Animated.sequence(rotationAnimations), Animated.sequence(scaleAnimations)]).start(() => { this.initialized = true; });
  }

  shouldComponentUpdate(nextProps: Readonly<any>, nextState: Readonly<any>, nextContext: any): boolean {
    if (nextProps.count !== this.props.count && this.initialized) {
      let rotationAnimations = [];
      let scaleAnimations = [];
      rotationAnimations.push(Animated.timing(this.state.angle, {
        toValue:  1,
        delay:    0,
        duration: 100,
        useNativeDriver: true
      }));
      rotationAnimations.push(Animated.timing(this.state.angle, {
        toValue:  -1,
        delay:    0,
        duration: 100,
        useNativeDriver: true
      }));
      rotationAnimations.push(Animated.timing(this.state.angle, {
        toValue:  0,
        delay:    0,
        duration: 50,
        useNativeDriver: true
      }));
      scaleAnimations.push(Animated.timing(this.state.scale, {
        toValue:  1.2,
        delay:    0,
        duration: 100,
        useNativeDriver: true
      }));
      scaleAnimations.push(Animated.timing(this.state.scale, {
        toValue:  0.9,
        delay:    100,
        duration: 100,
        useNativeDriver: true
      }));
      scaleAnimations.push(Animated.timing(this.state.scale, {
        toValue:  1,
        delay:    0,
        duration: 50,
        useNativeDriver: true
      }));

      Animated.parallel([Animated.sequence(rotationAnimations), Animated.sequence(scaleAnimations)]).start();
    }


    return true;
  }

  render() {
    let containerSize = this.props.containerSize;
    let radius   = 1.1*containerSize/2;
    let starSize = 40;
    let angle = this.props.angle;

    let starStyle: ViewStyle = {
      width: starSize, height:starSize, ...styles.centered
    }
    return (
      <Animated.View style={{
        ...starStyle,
        position:'absolute',
        top: 0.5*containerSize-radius*Math.sin(angle)-0.5*starSize,
        left: 0.5*containerSize-radius*Math.cos(angle)-0.5*starSize,
        transform: [{scale: this.state.scale}, {"rotate": this.state.angle.interpolate({inputRange: [-1, 1], outputRange: ['-10deg','10deg']})}]
      }}>
        <ScaledImage
          source={require('../../../../assets/images/star.png')}
          sourceHeight={480}
          sourceWidth={640}
          style={{...starStyle}}
        />
      </Animated.View>
    )
  }
}
