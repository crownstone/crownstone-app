import React, { Component } from 'react' 
import {
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { ProfilePicture } from './ProfilePicture'

import { Icon } from './Icon';

export class RoomCircle extends Component {
  constructor() {
    super();
    this.state = {};
  }

  _onPressButton() {
    this.props.goto('RoomOverview')
  }

  _getImage() {
    let borderWidth = this.props.radius / 15;
    let innerDiameter = 2*this.props.radius - 2 * borderWidth;
    let outerDiameter = 2*this.props.radius;
    let iconSize = this.props.radius*0.8;
    let textSize = this.props.radius/4;
    let offset = 0.05;
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
    // else {
      return (
        <View style={{
            width: outerDiameter,
            height: outerDiameter,
            backgroundColor:'transparent'
          }}>
        <View style={{
            borderWidth:borderWidth,
            borderColor:this.props.borderColor || '#ffffff',
            borderRadius:outerDiameter,
            width: outerDiameter,
            height: outerDiameter,
            backgroundColor:`rgb(${this.props.color.r},${this.props.color.g},${this.props.color.b})`
          }}>
            <View style={{
                position:'relative',
                top:-(offset) * outerDiameter - borderWidth,
                left:-borderWidth,
                backgroundColor:'transparent',
                width:outerDiameter,
                height:outerDiameter,
                alignItems:'center',
                justifyContent:'center'
                }}>
              <Icon name={this.props.icon} size={iconSize} color='#ffffff' />
            </View>
            <View style={{
                position:'relative',
                top:-(0.4 + offset)*outerDiameter - borderWidth,
                left:-borderWidth,
                backgroundColor:'transparent',
                width:outerDiameter,
                height:(0.4+offset)*outerDiameter,
                alignItems:'center',
                justifyContent:'center'
                }}>
              <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:textSize}}>{this.props.content.value + ' ' + this.props.content.unit}</Text>
            </View>
        </View>
      </View>
    );
  }

  render() {
    return <View style={{
      position:'absolute',
      top:this.props.pos.y,
      left:this.props.pos.x,
    }}>{this._getImage()}</View>
  }
}
