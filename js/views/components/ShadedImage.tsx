import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Image,
  View,
  Text
} from 'react-native';
import { WebGLView,  } from "react-native-webgl";
import {screenHeight, screenWidth} from "../styles";
import {preparePictureURI, Util} from "../../util/Util";
import {eventBus} from "../../util/EventBus";
import {request} from "../../cloud/cloudCore";


export class ShadedImage extends Component<{image: string, imageTaken: number, style?:any, r?, g?, b?, blendFactor?, grayScale?}, any> {

  loadedImageTaken = null;
  loadedImage = null;
  loadedImageURI = null;
  blendFactor = 0;
  diff = 0.01;
  animationFrame = null;
  _opacity = 0;
  _uid = Util.getUUID();

  constructor(props) {
    super(props);

    this.loadedImageTaken = this.props.imageTaken;
    this.loadedImage = this.props.image;
    this.loadedImageURI = {uri:preparePictureURI(this.loadedImage)};

    this.state = { debugText: '' };
  }

  componentWillUnmount() {
    eventBus.emit("cleanupTextures" + this._uid)
    cancelAnimationFrame(this.animationFrame);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // we use the image taken to show that the image has been updated. The name of the image is the locationId.
    if (this.props.image !== prevProps.image || this.props.imageTaken !== prevProps.imageTaken) {
      this.loadedImage = this.props.image;
      this.loadedImageTaken = this.props.imageTaken;
      this.loadedImageURI = {uri:this.loadedImage};
      eventBus.emit("changedPicture" + this._uid);
    }
    else if (
      this.props.r !== prevProps.r ||
      this.props.g !== prevProps.g ||
      this.props.b !== prevProps.b ||
      this.props.blendFactor !== prevProps.blendFactor ||
      this.props.grayScale   !== prevProps.grayScale
    ) {
      let blendMap = {};
      let steps = 10;
      if (this.props.r !== prevProps.r)                     { blendMap['r']           = {value: prevProps.r,           target: this.props.r, step: (this.props.r - prevProps.r) / steps}}
      if (this.props.g !== prevProps.g)                     { blendMap['g']           = {value: prevProps.g,           target: this.props.g, step: (this.props.g - prevProps.g) / steps}}
      if (this.props.b !== prevProps.b)                     { blendMap['b']           = {value: prevProps.b,           target: this.props.b, step: (this.props.b - prevProps.b) / steps}}
      if (this.props.blendFactor !== prevProps.blendFactor) { blendMap['blendFactor'] = {value: prevProps.blendFactor, target: this.props.blendFactor, step: (this.props.blendFactor - prevProps.blendFactor) / steps}}
      if (this.props.grayScale   !== prevProps.grayScale)   { blendMap['grayScale']   = {value: prevProps.grayScale,   target: this.props.grayScale,   step: (this.props.grayScale   - prevProps.grayScale  ) / steps}}
      eventBus.emit("changedVarariables" + this._uid, blendMap);
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
  
  // inverted the UV to flip the Y axis, done to avoid bug in loading with yflip true
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

uniform float grayScale;
uniform float opacity;

uniform float r;
uniform float g;
uniform float b;

void main() {
  float wComp = inputW/surfaceW;
  float hComp = inputH/surfaceH;
  
  vec2 transformedUV = uv;
  if (wComp > hComp) {
    // H is scaled up, W has to scale to correct and W will be shifted
    
    float scale = surfaceW * hComp / inputW;
    float newW = inputW / hComp;
    float centerCorrection = 0.5*(newW - surfaceW) / newW;
    
    transformedUV = uv * vec2(scale, 1.0) + vec2(centerCorrection,0.);
  }
  else {
    // W is scaled up, H has to scale to correct and H will be shifted
    
    float scale = surfaceH * wComp / inputH;
    float newH = inputH / wComp;
    float centerCorrection = 0.5*(newH - surfaceH) / newH;
    
    transformedUV = uv * vec2(1., scale) + vec2(0.,centerCorrection);
  }
  
  // transform the UV vector
  vec4 c = texture2D(inputImage, transformedUV);
  
  // Grayscale transformation based on HSL
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  
  // prepare for possible grayscale.
  vec3 result = c.rgb;
  
  if (grayScale != 0.) {
    // transform color to grayscale.
    vec3 gray = vec3(dot(c.rgb, W));
    
    if (grayScale == 1.) {
      result = gray;
    }
    else {
      result = mix(c.rgb, gray.rgb, grayScale);
    }
  }
  
  // background color
  vec3 color = vec3(r,g,b);
    
  // blend the color into the background image.
  vec3 res = mix(result * color, color, blendFactor);
  
  gl_FragColor = vec4(res, opacity);
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
    let tLocation           = gl.getUniformLocation(program, "inputImage");
    let inputWLocation      = gl.getUniformLocation(program, "inputW");
    let inputHLocation      = gl.getUniformLocation(program, "inputH");
    let surfaceWLocation    = gl.getUniformLocation(program, "surfaceW");
    let surfaceHLocation    = gl.getUniformLocation(program, "surfaceH");
    let blendFactorLocation = gl.getUniformLocation(program, "blendFactor");
    let grayScaleLocation   = gl.getUniformLocation(program, "grayScale");
    let opacityLocation     = gl.getUniformLocation(program, "opacity");
    let rLocation = gl.getUniformLocation(program, "r");
    let gLocation = gl.getUniformLocation(program, "g");
    let bLocation = gl.getUniformLocation(program, "b");
    let loadedTexture = null;

    let variables = [
      'opacity',
      'grayScale',
      'blendFactor',
      'r',
      'g',
      'b',
    ]

    /**
     * This function uses a blendmap to fade from one set of values to another.
     * The blendmap looks like this:
     *   blendMap['r']           = {value: currentValue, target: targetValue, step: stepSize}
     *   blendMap['g']           = {value: currentValue, target: targetValue, step: stepSize}
     *   blendMap['b']           = {value: currentValue, target: targetValue, step: stepSize}
     *   blendMap['blendFactor'] = {value: currentValue, target: targetValue, step: stepSize}
     *   blendMap['grayScale']   = {value: currentValue, target: targetValue, step: stepSize}
     *
     * it does not have to be fully filled
     * @param blendMap
     */
    const animateFade = (blendMap) => {
      let values : any = {}
      let animationFinished = true;
      for ( let i = 0; i < variables.length; i++) {
        if (blendMap[variables[i]]) {
          animationFinished = false;
          blendMap[variables[i]].value += blendMap[variables[i]].step;
          if (Math.abs(blendMap[variables[i]].value - blendMap[variables[i]].target) < 0.03) {
            delete blendMap[variables[i]]
          }
        }
        if (variables[i] === 'opacity') {
          values[variables[i]] = blendMap[variables[i]] ? blendMap[variables[i]].value : this._opacity
        }
        else {
          values[variables[i]] = blendMap[variables[i]] ? blendMap[variables[i]].value : this.props[variables[i]]
        }
      }
      // this.setState({debugText:JSON.stringify(values)})
      loadVariables(values);
      draw();

      if (!animationFinished) {
        this.animationFrame = requestAnimationFrame(() => { animateFade(blendMap) })
      }
    }

    const loadDefaultVariables = () => {
      loadVariables({
        opacity:  this._opacity,
        grayScale:  this.props.grayScale,
        blendFactor:this.props.blendFactor,
        r: this.props.r,
        g: this.props.g,
        b: this.props.b,
      });
    }

    const loadVariables = ({opacity, grayScale, blendFactor, r, g, b}) => {
      gl.uniform1f(opacityLocation,opacity || 0.0);

      gl.uniform1f(grayScaleLocation,   grayScale   || 0.0);
      gl.uniform1f(blendFactorLocation, blendFactor || 0.0);
      gl.uniform1f(rLocation, r || 0.0);
      gl.uniform1f(gLocation, g || 0.0);
      gl.uniform1f(bLocation, b || 0.0);

      gl.uniform1f(surfaceWLocation, gl.drawingBufferWidth);
      gl.uniform1f(surfaceHLocation, gl.drawingBufferHeight);
    }

    const draw = () => {
      gl.enable( gl.BLEND );
      gl.blendEquationSeparate( gl.FUNC_ADD, gl.FUNC_ADD );
      gl.blendFuncSeparate( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

      gl.colorMask(true, true, true, true);
      gl.clearColor(0.0,0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.flush();
      rngl.endFrame();
    }

    const drawWithNewTexture = (fadeIn?) => {
      draw();
      rngl
        .loadTexture({ image: this.loadedImageURI, yflip: false })
        .then((result) => {
          this._opacity = 0;
          loadDefaultVariables();
          loadedTexture = result;
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, result.texture);
          gl.uniform1i(tLocation, 0);
          gl.uniform1f(inputWLocation, result.width);
          gl.uniform1f(inputHLocation, result.height);

          draw();

          if (fadeIn) {
            this._opacity = 1;
            requestAnimationFrame(() => { animateFade({opacity: {value: 0.0, target: 1, step: 0.1}}) })
          }
        });
    }

    drawWithNewTexture(true);

    eventBus.on("changedPicture" + this._uid, () => {
      if (loadedTexture) {
        rngl.unloadTexture(loadedTexture.texture)
      }
      drawWithNewTexture(true)
    })

    eventBus.on("changedVarariables" + this._uid, (blendMap) => {
      this.animationFrame = requestAnimationFrame(() => { animateFade(blendMap) })
    })

    eventBus.on("cleanupTextures" + this._uid, () => {
      if (loadedTexture) {
        rngl.unloadTexture(loadedTexture.texture)
      }
    })
  };
  render() {
    return (
      <WebGLView
        style={[this.props.style,{backgroundColor:"transparent"}]}
        onContextCreate={this.onContextCreate}
      />
    );
  }
}