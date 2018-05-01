import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { colors } from '../styles'

const Actions = require('react-native-router-flux').Actions;

import {IconCircle} from "./IconCircle";
import {eventBus} from "../../util/EventBus";


class MeshElementClass extends Component<any, any> {
  usage : any;
  borderWidth : number;
  animating : boolean;

  moveAnimationTimeout : any;
  color : any;

  unsubscribeStoreEvents : any;
  unsubscribeControlEvents : any;

  constructor(props) {
    super(props);

    this.state = {
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    };
  }


  componentDidMount() {
    this.unsubscribeControlEvents = eventBus.on('nodeWasTapped'+this.props.id, (data) => {
      this.handleTap(data);
    });

    this.unsubscribeControlEvents = eventBus.on('nodeTouched'+this.props.id, (data) => {
      this.handleTouch(data);
    });

    this.unsubscribeControlEvents = eventBus.on('nodeReleased'+this.props.id, (data) => {
      this.handleTouchReleased(data);
    })
  }


  componentWillUnmount() {
    clearTimeout(this.moveAnimationTimeout);
    this.unsubscribeControlEvents();
  }


  render() {
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    let width    = 2*this.props.radius;
    let height   = 2*this.props.radius;
    let overlap  = 0.25;
    let iconSize = 0.5*(width + overlap*width);

    let innerWidth  = 0.95*width;
    let innerWidth2 = 0.85*width;

    return (
      <Animated.View style={[animatedStyle, {position:'absolute', top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity, width:width, height: height, overflow:'hidden'}]}>
        <View style={{position:"absolute", top:0.5*(width-innerWidth),  left:0.5*(width-innerWidth),  width: innerWidth,  height: innerWidth,  borderRadius: 0.5*innerWidth,  borderWidth: 0.03*innerWidth, borderColor: "#fff"}} />
        <View style={{position:"absolute", top:0.5*(width-innerWidth2), left:0.5*(width-innerWidth2), width: innerWidth2, height: innerWidth2, borderRadius: 0.5*innerWidth2, borderWidth: 0.1*innerWidth2, borderColor: "#fff", backgroundColor:colors.darkBackground.hex}} />
        <View style={{position:"absolute", top:0, left:0, flexDirection:'row', alignItems:'center', justifyContent:'flex-start', width:width, height: height, overflow:'hidden'}}>
          <IconCircle icon={this.props.nodeData.locationIcon} size={iconSize} backgroundColor={this.props.nodeData.locationColor} color={colors.white.hex} borderColor={colors.csBlue.hex} style={{position:'relative', top:-0.5*overlap*width, left:0}} />
          <IconCircle icon={this.props.nodeData.element.config.icon} size={iconSize} backgroundColor={colors.csBlue.hex} color="#fff" borderColor={colors.csBlue.hex} style={{position:'relative', top:0.5*overlap*width, left: -overlap*width}} />
        </View>
      </Animated.View>
    )
  }

  handleTouch(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70 }));
    // tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, duration: 100}));
    Animated.parallel(tapAnimations).start();
  }

  handleTouchReleased(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    // revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();
  }

  handleTap(data) {
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    this.state.scale.setValue(1);
    // this.state.opacity.setValue(1);
  }
}

export const MeshElement = Animated.createAnimatedComponent(MeshElementClass);

// ------------------------------------------------------------ //
// code for when there was an image behind the icon
// ------------------------------------------------------------ //
// if (this.props.backgroundImage) {
//   return (
//     <View style={{
//         width: outerDiameter,
//         height: outerDiameter,
//         backgroundColor:'transparent'
//       }}>
//       <View style={{
//         borderWidth:borderWidth,
//         borderColor:this.props.borderColor || '#ffffff',
//         borderRadius:outerDiameter,
//         width: outerDiameter,
//         height: outerDiameter,
//         backgroundColor:`rgb(${this.props.color.r},${this.props.color.g},${this.props.color.b})`
//       }}>
//         <Surface
//           width={innerDiameter}
//           height={innerDiameter}
//           backgroundColor='transparent'>
//           <CircleCrop>
//             <ImageHueBlend
//               r={this.props.color.r/255}
//               g={this.props.color.g/255}
//               b={this.props.color.b/255}
//               blendFactor={0.7}
//               image={this.props.backgroundImage}
//             />
//           </CircleCrop>
//         </Surface>
//       </View>
//       <View style={{
//         position:'relative',
//         top:-(1+offset)* outerDiameter,
//         left:0,
//         backgroundColor:'transparent',
//         width:outerDiameter,
//         height:outerDiameter,
//         alignItems:'center',
//         justifyContent:'center'
//         }}>
//         <Ionicon name={this.props.icon} size={iconSize} color='#ffffff' />
//       </View>
//       <View style={{
//         position:'relative',
//         top:-(1.4 + offset)*outerDiameter,
//         backgroundColor:'transparent',
//         width:outerDiameter,
//         height:(0.4+offset)*outerDiameter,
//         alignItems:'center',
//         justifyContent:'center'
//         }}>
//         <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:iconSize/4}}>{this.props.content.value + ' ' + this.props.content.unit}</Text>
//       </View>
//     </View>
//   );
// }