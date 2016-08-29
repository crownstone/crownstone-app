import React, { Component } from 'react' 
import {
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { styles, width, height, colors } from '../styles'
import { getCurrentPowerUsageFromState } from '../../util/dataUtil'
import { PresentUsers } from './PresentUsers'
import { Icon } from './Icon';


import Svg,{ Circle } from 'react-native-svg';

export class RoomCircle extends Component {
  constructor(props) {
    super();
    this.state = {};

    this.levels = [
      {min: 0,    max:200,   color: colors.green.hex},
      {min: 200,  max:500,   color: colors.orange.hex},
      {min: 500,  max:1500,  color: colors.red.hex},
      {min: 1500, max:4000,  color: colors.darkRed.hex},
    ];

    this.usage = 0;

    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 15;
    this.innerDiameter = 2*props.radius - 4.5 * this.borderWidth;
    this.outerDiameter = 2*props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;
    this.color = this._getColor(this.usage);
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      if (this.renderState === undefined)
        return;
      // only redraw if the power usage changes or if the settings of the room change
      const state = store.getState();
      let usage = getCurrentPowerUsageFromState(state, this.props.groupId, this.props.locationId);

      // in the case the room is deleted, do not redraw.
      if (this.props.locationId !== null && state.groups[this.props.groupId].locations[this.props.locationId] === undefined) {
        return;
      }

      if (this.props.locationId !== null) {
        if (usage !== this.usage || state.groups[this.props.groupId].locations[this.props.locationId].config != this.renderState.groups[this.props.groupId].locations[this.props.locationId].config) {
          this.usage = usage;
          this.color = this._getColor(this.usage);
          this.forceUpdate();
        }
      }
      else if (usage !== this.usage) {
        this.usage = usage;
        this.color = this._getColor(this.usage);
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  shouldComponentUpdate(nextProps, nextState) {
    // console.log("Should component update?",nextProps, nextState)
    return false
  }


  _getLevel(usage) {
    for (let i = 0; i < this.levels.length; i++) {
      if (usage < this.levels[i].max)
        return i
    }
    return this.levels.length-1;
  }

  _getColor(usage, prev = false) {
    let level = this._getLevel(usage);
    if (prev) {
      if (level == 0) {
        return "#eee"
      }
      else {
        return this.levels[level-1].color
      }
    }
    return this.levels[level].color
  }


  getCircle(room) {
    // this.usage = 2550;
    // this.color = this._getColor(this.usage);
    return (
      <View>
        <View style={{
          borderRadius: this.outerDiameter,
          width: this.outerDiameter,
          height: this.outerDiameter,
          backgroundColor:'#ffffff',
          padding:0,
          margin:0
        }}>
          {this._getUsageCircle(this.usage)}
          <View style={{
            position:'relative',
            top:-this.outerDiameter + 2.25*this.borderWidth,
            left: 2.25*this.borderWidth,
            borderRadius:this.innerDiameter,
            width: this.innerDiameter,
            height: this.innerDiameter,
            backgroundColor: this.color,
            padding:0,
            margin:0,
            justifyContent:'center',
            alignItems:'center'
          }}><View style={[styles.centered,{height:0.5*this.innerDiameter}]}>
            <Icon name={room.config.icon} size={this.iconSize} color='#ffffff' style={{backgroundColor:'transparent'}} />
            </View>
            <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:this.textSize}}>{this.usage + " W"}</Text>
          </View>
        </View>
      </View>
    );
  }


  _getUsageCircle(usage) {
    let prevColor = this._getColor(usage, true);
    let pathLength = Math.PI * 2 * this.props.radius;
    if (usage == 0)
      return (
        <Svg style={{
          width: this.outerDiameter,
          height: this.outerDiameter,
        }} >
          <Circle
            r={this.props.radius - this.borderWidth}
            stroke={prevColor}
            strokeWidth={this.borderWidth}
            strokeDasharray={[pathLength,pathLength]}
            rotate="-90"
            x={this.props.radius}
            y={this.props.radius}
            strokeLinecap="round"
            fill="white"
          />
        </Svg>
    );

    return (
      <Svg style={{
        width: this.outerDiameter,
        height: this.outerDiameter,
      }}>
        <Circle
          r={this.props.radius - this.borderWidth}
          stroke={prevColor}
          strokeWidth={this.borderWidth}
          strokeDasharray={[pathLength,pathLength]}
          rotate="-90"
          x={this.props.radius}
          y={this.props.radius}
          strokeLinecap="round"
          fill="white"
        />
        <Circle
          r={this.props.radius - this.borderWidth}
          stroke={this.color}
          strokeWidth={this.borderWidth}
          strokeDasharray={[pathLength*this._getFactor(usage),pathLength]}
          rotate="-90"
          x={this.props.radius}
          y={this.props.radius}
          strokeLinecap="round"
          fill="rgba(0,0,0,0)"
        />
      </Svg>
    )
  }


  _getFactor(usage) {
    let level = this._getLevel(usage);
    let minW = this.levels[level].min;
    let maxW = this.levels[level].max;
    let val = (usage-minW) / (maxW-minW);

    if (val < 0.5) {
      return val - (0.2*val*val);
    }
    else if (val < 0.84) {
      return 0.61 + (0.9*val-0.6)
    }
    return 0.8*val*val + 0.2;
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    this.renderState = store.getState();

    let room;
    if (this.props.locationId === null) {
      room = {config:{icon:'c2-pluginFilled'}}
    }
    else {
      room = state.groups[this.props.groupId].locations[this.props.locationId];
    }

    return (
      <View style={{position:'absolute', top:this.props.pos.y, left:this.props.pos.x}}>
        {this.getCircle(room)}
        {this.props.locationId === null ? undefined : <PresentUsers locationId={this.props.locationId} store={store} roomRadius={this.props.radius} />}
      </View>
    )
  }
}

// code for when there was an image behind the icon
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