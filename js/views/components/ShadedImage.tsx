import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  View
} from 'react-native';
import { WebGLView,  } from "react-native-webgl";
import {screenHeight, screenWidth} from "../styles";
import {preparePictureURI, Util} from "../../util/Util";
import {eventBus} from "../../util/EventBus";


export class ShadedImage extends Component<{image: string, style?:any}, any> {

  loadedImage = null;
  loadedImageURI = null;
  requestId = null;
  blendFactor = 0;
  diff = 0.01;
  initialized = false;
  _uid = Util.getUUID();

  constructor(props) {
    super(props);

    this.loadedImage = this.props.image;
    this.loadedImageURI = {uri:preparePictureURI(this.loadedImage)};

    console.log('this.loadedImageURI',this.loadedImageURI)

    // let anim = () => {
    //   if (this.blendFactor >= 1 || this.blendFactor < 0) {
    //     this.diff *= -1;
    //   }
    //
    //   this.blendFactor += this.diff;
    //   Math.max(0, Math.min(this.blendFactor, 1))
    //   eventBus.emit('rdew', this.blendFactor);
    //   // if (this.blendFactor > 0) {
    //   this.requestId = requestAnimationFrame(anim);
    //   // }
    //
    // }
    // this.requestId = requestAnimationFrame(anim);
  }

  componentWillUnmount() {
    eventBus.emit("cleanupTextures" + this._uid)
    cancelAnimationFrame(this.requestId);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.image !== prevProps.image) {
      this.loadedImage = this.props.image;
      this.loadedImageURI = {uri:this.loadedImage};
    }
  }

  onContextCreate = (gl: WebGLRenderingContext) => {
    const rngl = gl.getExtension("RN");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 3, 3, -1]),
      gl.STATIC_DRAW
    );
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vertexShader,
      `\
attribute vec2 p;
varying vec2 uv;

void main() {
  vec4 pos = vec4(p,0.0,1.0);
  // inverted the UV to flip the Y axis
  uv.xy = vec2(0.5*(p.x+1.), 0.5*(1.0 - p.y));
  // uv = 0.5 * (p+1.0);
  gl_Position = pos;
}`
    );
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fragmentShader,
      `\
precision highp float;
varying vec2 uv;
uniform sampler2D inputImage;
uniform float blendFactor;
uniform float inputW;
uniform float inputH;
uniform float surfaceW;
uniform float surfaceH;

void main() {
  // image ratio
  float imageRatio   = inputW / inputH;
  float surfaceRatio = surfaceW / surfaceH;
  float compare = surfaceRatio / imageRatio;
  
  float shift = 0.5*(inputH/inputW - 1.0);
  if (inputW > inputH) {
    shift = 0.5*(inputW/inputH - 1.0);
  }
  
  vec2 transformedUV = uv;
  if (imageRatio > surfaceRatio) {
    // get the texture
    shift = ((inputW*compare)/surfaceW);
    
    transformedUV = uv * vec2(compare, 1.0) + vec2(shift,0.);
  }
  else {
    // get the texture
    shift = ((inputH/compare)/surfaceH);
    transformedUV = uv * vec2(1., 1./compare) + vec2(0., shift);
  }
  
  vec4 c = texture2D(inputImage, transformedUV);
  
  // Grayscale transformation based on HSL
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  
  // transform color to grayscale.
  vec3 gray = vec3(dot(c.rgb, W));
  
  // background color
  vec3 color = vec3(1.0,0,0);
  
  // vec3 res = mix(gray * color, color, blendFactor);
  
  gl_FragColor = vec4(gray,c.a);
}`
    );
    gl.compileShader(fragmentShader);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    var p = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    const tLocation = gl.getUniformLocation(program, "inputImage");
    let inputWLocation = gl.getUniformLocation(program, "inputW");
    let inputHLocation = gl.getUniformLocation(program, "inputH");
    let surfaceWLocation = gl.getUniformLocation(program, "surfaceW");
    let surfaceHLocation = gl.getUniformLocation(program, "surfaceH");
    let blendFactorLocation = gl.getUniformLocation(program, "blendFactor");
    gl.uniform1f(surfaceWLocation, gl.drawingBufferWidth);
    gl.uniform1f(surfaceHLocation, gl.drawingBufferHeight);
    let loadedTexture = null;
    rngl
      .loadTexture({ image: this.loadedImageURI, yflip: false })
      .then((result) => {
        loadedTexture = result;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, result.texture);
        gl.uniform1i(tLocation, 0);
        gl.uniform1f(inputWLocation, result.width);
        gl.uniform1f(inputHLocation, result.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.flush();
        rngl.endFrame();
        this.initialized = true;
      });

    // eventBus.on("rdew", (d) => {
    //   if (this.initialized === true) {
    //     gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    //     gl.drawArrays(gl.TRIANGLES, 0, 3);
    //     gl.uniform1f(blendFactorLocation, d);
    //     gl.flush();
    //     rngl.endFrame()
    //   }
    // })

    eventBus.on("cleanupTextures" + this._uid, () => {
      if (loadedTexture) {
        rngl.unloadTexture(loadedTexture)
      }
    })
  };
  render() {
    return (
      <View style={{position:'absolute',top:0, left:0, width: screenWidth, height:screenHeight}}>
        <WebGLView
          style={{width: screenWidth, height:screenHeight}}
          onContextCreate={this.onContextCreate}
        />
      </View>
    );
  }
}