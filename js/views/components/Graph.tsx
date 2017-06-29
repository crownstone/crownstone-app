import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  View
} from 'react-native';
import { Icon } from './Icon'
import { styles, colors } from '../styles'
import {
  Svg,
  Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Use,
  Text,
  Defs,
} from 'react-native-svg';
import {GraphingEngine} from "../../logic/GraphingEngine";

let outerBound = 30;

export class Graph extends Component<any, any> {
  data : any[];
  options : any;

  constructor(props) {
    super();

    this.options = {
      interpolation: {
        enabled: true,
        parametrization: 'chordal', // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
        alpha: 0.5
      },
      height: props.height,
      width: props.width,
    };
  }

  loadData() {
    this.data = [];
    for (let i = 0; i < 30; i++) {
      this.data.push({x:i, y: Math.abs(Math.sin(i*i/Math.PI))});
    }

    GraphingEngine.transformXToFit(this.data, this.options.width - 2*outerBound, outerBound);
    GraphingEngine.transformYToFit(this.data, this.options.height- 2*outerBound, outerBound);

  }

  _getCurves() {
    this.loadData();
    let pathArray = GraphingEngine.calcPath(this.data, this.options);
    let type = "L";
    if (this.options.interpolation.enabled === true){
      type = "C";
    }

    return (
      <Path
        type={type}
        d={'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " + GraphingEngine.serializePath(pathArray, type, false)}
        stroke="white"
        fillOpacity={0}
        strokeWidth={2}
      />
    );
  }

  _getPoints() {
    let points = [];
    for (let i = 0; i < this.data.length; i++) {
      points.push(<Circle
        key={'point' + i}
        r={3}
        x={this.data[i].x}
        y={this.data[i].y}
        fill={'transparent'}
        stroke={colors.csOrange.hex}
        strokeWidth={2}
      />)
    }

    return points;
  }

  _getGrid() {
    let elements = [];
    let maxX = this.props.width-outerBound;
    let minX = outerBound;
    let maxY = this.props.height-outerBound;
    let minY = outerBound;

    let padding = 10;

    elements.push(<Line key="bottomGridBarBack" x1={minX-padding} y1={maxY} x2={maxX+padding} y2={maxY} stroke={colors.white.rgba(0.4)} stroke-width={2} strokeLinecap="round" />);
    elements.push(<Line key="bottomGridBar"     x1={minX} y1={maxY} x2={maxX} y2={maxY} stroke={colors.white.hex}       stroke-width={2} strokeLinecap="round" />);
    elements.push(<Line key="sideGridBarBack"   x1={minX} y1={minY-padding} x2={minX} y2={maxY+padding} stroke={colors.white.rgba(0.4)} stroke-width={2} strokeLinecap="round" />);
    elements.push(<Line key="sideGridBar"       x1={minX} y1={minY} x2={minX} y2={maxY} stroke={colors.white.hex}       stroke-width={2} strokeLinecap="round" />);

    // side steps


    // bottom steps
    let amountOfBottomSteps = 10;
    let stepSize = (maxX - minX) / (amountOfBottomSteps-1);
    for (let i = 0; i < amountOfBottomSteps; i++) {
      let x = minX + i*stepSize;
      let tx = x-15;
      let ty = maxY + 15;
      elements.push(<Line key={'bottomStep'+i}  x1={x} y1={minY-0.5*padding} x2={x} y2={maxY+0.5*padding} stroke={colors.white.rgba(0.1)} stroke-width={2} strokeLinecap="round" />)
      elements.push(<Text key={'bottomStepLabel'+i}  x={tx} y={ty} originX={tx} originY={ty} fontSize={11} fill={colors.white.rgba(0.5)} textAnchor="middle" rotate="-45" >here</Text>)

    }

    return elements;
  }

  render() {
    return (
      <Svg style={{width: this.props.width, height: this.props.height+50}}>
        {this._getCurves()}
        {this._getPoints()}
        {this._getGrid()}
      </Svg>
    );
  }
}