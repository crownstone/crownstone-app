import * as React from 'react'; import { Component } from 'react';
import { Svg, Circle } from 'react-native-svg';

export class ProgressCircle extends Component<any, any> {
  render() {
    let radius = this.props.radius;
    let borderWidth = this.props.borderWidth;
    let pathLength = Math.PI * 2 * (radius - borderWidth); // 10 for borderWidth;
    let style = { width: 2*radius, height: 2*radius };
    if (this.props.absolute) {
      style['position'] = 'absolute';
      style['top'] = 0;
      style['left'] = 0;
    }

    return (
      <Svg style={style}>
        <Circle
          r={radius-borderWidth}
          stroke={this.props.color}
          strokeWidth={0.5*borderWidth}
          strokeDasharray={[pathLength*this.props.progress,pathLength]}
          rotation="-89.9"
          x={radius}
          y={radius}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
    )
  }
}