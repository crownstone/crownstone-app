import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
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
  Defs,
} from 'react-native-svg';

class Graph extends Component<any, any> {
  data : any[]

  loadData() {
    this.data = [];
    for (let i = 0; i < 100; i++) {
      this.data.push({id:i, x:i, y:Math.sin(i/Math.PI)});
    }
  }

  render() {
    return (
      <Svg style={{width: this.props.width, height: this.props.height}}>

      </Svg>
    );
  }
}