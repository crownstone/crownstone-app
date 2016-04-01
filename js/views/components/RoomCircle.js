import React, {
  Component,
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

const GL = require('gl-react');
const { Surface } = require('gl-react-native'); // in React Native context
const Ionicon = require('react-native-vector-icons/Ionicons');

const shaders = GL.Shaders.create({
  imageHueBlend: {
    frag: `
precision highp float;
varying vec2 uv;
uniform sampler2D image;
uniform float blendFactor;
uniform float r;
uniform float g;
uniform float b;
uniform float inputW;
uniform float inputH;

void main () {
  // determine how much to shift the image
  float ratio = inputH/inputW;
  float shift = 0.5*(inputW/inputH - 1.0);

  // get the texture
  vec2 transformedUV = uv*vec2(ratio,1.0)+vec2(shift,0.0);
  vec4 c = texture2D(image, transformedUV);

  // Grayscale transformation based on HSL
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);

  // background color
  vec3 color = vec3(r,g,b);

  // transform color to grayscale.
  vec3 gray = vec3(dot(c.rgb, W));

  // multiply and mix with background
  vec3 res = mix(gray * color, color, blendFactor);

  // transformation operation.
  gl_FragColor = vec4(res,c.a);
}
    `
  },
  circleCrop: {
    frag: `
precision highp float;
varying vec2 uv;
uniform sampler2D t;
void main () {
  gl_FragColor = mix(
    texture2D(t, uv),
    vec4(0.0),
    step(0.5, distance(uv, vec2(0.5))));
}`
  }
});

const ImageHueBlend = GL.createComponent(
  ({ r, g, b, blendFactor, image }) =>
    <GL.Node shader={shaders.imageHueBlend} uniforms={{ r, g, b, blendFactor, image, inputW:image.width, inputH:image.height }} />
);

const CircleCrop = GL.createComponent(
  ({ children: t }) => <GL.Node shader={shaders.circleCrop} uniforms={{ t }} />
);


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
    let iconSize = this.props.radius;
    let offset = 0.05;
    if (this.props.backgroundImage) {
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
            <Surface
              width={innerDiameter}
              height={innerDiameter}
              backgroundColor='transparent'>
              <CircleCrop>
                <ImageHueBlend
                  r={this.props.color.r/255}
                  g={this.props.color.g/255}
                  b={this.props.color.b/255}
                  blendFactor={0.7}
                  image={this.props.backgroundImage}
                />
              </CircleCrop>
            </Surface>
          </View>
          <View style={{
            position:'relative',
            top:-(1+offset)* outerDiameter,
            left:0,
            backgroundColor:'transparent',
            width:outerDiameter,
            height:outerDiameter,
            alignItems:'center',
            justifyContent:'center'
            }}>
            <Ionicon name={this.props.icon} size={iconSize} color='#ffffff' />
          </View>
          <View style={{
            position:'relative',
            top:-(1.4 + offset)*outerDiameter,
            backgroundColor:'transparent',
            width:outerDiameter,
            height:(0.4+offset)*outerDiameter,
            alignItems:'center',
            justifyContent:'center'
            }}>
            <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:iconSize/4}}>{this.props.content.value + ' ' + this.props.content.unit}</Text>
          </View>
        </View>
      );
    }
    else {
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
            <Ionicon name={this.props.icon} size={iconSize} color='#ffffff' />
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
            <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:iconSize/4}}>{this.props.content.value + ' ' + this.props.content.unit}</Text>
          </View>
      </View>
      </View>
      );
    }
  }

  render() {
    return <View style={{
      position:'absolute',
      top:this.props.pos.y,
      left:this.props.pos.x,
    }}>{this._getImage()}</View>
  }
}
