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
import {GraphingEngine} from "../../logic/GraphingEngine";

export class Graph extends Component<any, any> {
  data : any[]

  loadData() {
    this.data = [];
    for (let i = 0; i < 100; i++) {
      this.data.push({x:i, y:Math.sin(i/Math.PI)});
    }


  }

  _getCurves() {
    let options = {
      interpolation: {
        enabled: true,
        parametrization: 'centripetal', // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
        alpha: 0.5
      }
    }
    let pathArray = GraphingEngine.calcPath(this.data, options);
    var type = "L";
    if (options.interpolation.enabled === true){
      type = "C";
    }

    return <Path
      type={type}
      d={'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " + GraphingEngine.serializePath(pathArray, type, false)}
    />
  }

  render() {
    return (
      <Svg style={{width: this.props.width, height: this.props.height}}>
        {this._getCurves()}
      </Svg>
    );
  }
}