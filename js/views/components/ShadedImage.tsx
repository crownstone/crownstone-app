import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  View
} from 'react-native';
import { WebGLView, Surface } from "react-native-webgl";


export class ShadedImage extends Component<{source: any, style?:any}, any> {
  onContextCreate = (gl: WebGLRenderingContext) => {
    const rngl = gl.getExtension("RN");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 4, 4, -1]),
      gl.STATIC_DRAW
    );
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vertexShader,
      `\
attribute vec2 p;
varying vec2 uv;
void main() {
  gl_Position = vec4(p,0.0,1.0);
  uv = .5*(1.+p);
}`
    );
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fragmentShader,
      `\
precision highp float;
varying vec2 uv;
uniform sampler2D t;
void main() {
  gl_FragColor = vec4(uv, 0.5, 1.0);
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
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.flush();
    rngl.endFrame();
  };
  render() {
    return (
        <WebGLView
          style={{position:'absolute', bottom:50, left:0, width:100, height:100, backgroundColor:"#F00"}}
          onContextCreate={this.onContextCreate}
        />
    );
  }
  // render() {
  //   return (
  //     <WebGLView
  //       style={this.props.style}
  //       onContextCreate={this.onContextCreate}
  //     />
  //   );
  // }
  // render() {
  //   return (
  //     <Image source={this.props.source} style={this.props.style} />
  //   );
  // }
}