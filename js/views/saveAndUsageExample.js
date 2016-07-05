import React, { Component } from 'react' 
import {
  
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import {TopBar} from './components/Topbar'
import {Background} from './components/Background'
import {styles, colors} from './styles'

let RNFS = require('react-native-fs');
const GL = require('gl-react');
const { Surface } = require('gl-react-native'); // in React Native context


const shaders = GL.Shaders.create({
  saturation: {
    frag: `
precision highp float;
varying vec2 uv;
uniform sampler2D image;
uniform float factor;
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
  vec3 res = mix(gray * color, color, factor);

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

const Saturation = GL.createComponent(
  ({ r, g, b, factor, image, inputW, inputH }) =>
    <GL.Node shader={shaders.saturation} uniforms={{ r, g, b, factor, image, inputW, inputH }} />, { displayName: 'Saturation' }
);

const CircleCrop = GL.createComponent(
  ({ children: t }) => <GL.Node shader={shaders.circleCrop} uniforms={{ t }} />
);


export class HomeOverview extends Component {
  constructor() {
    super();
    this.state = {title:'none'};
    /*
    let TitleMaker = NativeModules.TitleMaker;
    TitleMaker.get(1, (result) => {
      this.state.title = result.title;
      this.setState(this.state);
    });
    */
    // resolve image before using.
    this.image = resolveAssetSource(require('../images/mediaRoom.png'));
    this.state.imagePath = undefined;
    this.requestLoad = true;
  }

  _onPressButton() {
    this.props.goto('RoomOverview')
  }

  onRef(input) {
    if (this.requestLoad === true) {
      this.requestLoad = false;
      console.log('Rendering Offscreen')
      // create a path you want to write to
      var path = RNFS.DocumentDirectoryPath + '/image.png';
      input.captureFrame({type:'png', format:'file', filePath: path, quality:1}).then((filePath) => {
        console.log('captured!', RNFS.CachesDirectoryPath, filePath, arguments)
        this.state.imagePath = filePath
        this.setState(this.state)
      });


    }

  }

  _getImage() {
    console.log('requestedImage')
    if (this.state.imagePath !== undefined) {
      console.log('presenting image',this.state);
      return <Image style={{width:300, height:300}} source={{uri: this.state.imagePath}} />
    }
  }

  render() {
    let offscreenRender;
    if (this.requestLoad === true) {
      console.log('setup')
      let width = Dimensions.get('window').width;
      offscreenRender = <View style={{position:'absolute', top:0, left:width}}>
        <Surface ref={this.onRef.bind(this)} width={300} height={300} preload={true}>
          <Saturation
            r={colors.red.r/255}
            g={colors.red.g/255}
            b={colors.red.b/255}
            factor={0.3}
            image={this.image}
            inputW={300}
            inputH={150}
          />
        </Surface>
      </View>
    }
    console.log('drawing')
    return (
      <Background>
        {this._getImage()}
        <TopBar name={this.props.name} />
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <TouchableHighlight onPress={() => this._onPressButton()}>
            <Text>{this.state.title}</Text>
          </TouchableHighlight>
          <View style={{borderWidth:20, borderColor:colors.red.hex, borderRadius:170, backgroundColor:colors.red.hex}}>
            <Surface width={300} height={300}>
              <CircleCrop>
                <Saturation
                  r={colors.red.r/255}
                  g={colors.red.g/255}
                  b={colors.red.b/255}
                  factor={0.0}
                  image={this.image}
                  inputW={300}
                  inputH={150}
                />
              </CircleCrop>
            </Surface>
          </View>

        </View>
        {offscreenRender}
      </Background>
    )
  }
}
