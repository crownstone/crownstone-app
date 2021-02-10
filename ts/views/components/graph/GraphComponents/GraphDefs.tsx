import * as React from 'react'; import { Component } from 'react';
import { colors } from '../../../styles'
import {
  ClipPath,
  LinearGradient,
  Rect,
  Stop,
  Defs,
} from 'react-native-svg';

export class GraphDefs extends Component<any, any> {
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.options !== nextProps.options;
  }

  render() {
    let options = this.props.options;

    let hideSide = (
      <ClipPath id="showBody">
        <Rect x={options.padding} y={0} width={options.width} height={options.height} />
      </ClipPath>
    );
    return (
      <Defs key="GradientDiff">
        { this.props.hideFadeArea !== true && hideSide }
        <ClipPath id="showSide">
          <Rect x={0} y={0} width={options.padding} height={options.height} />
        </ClipPath>
        <LinearGradient id="grad" x1={0} y1={options.padding} x2={0} y2={options.height - options.paddingBottom}>
          <Stop offset="0" stopColor={colors.green.hex} stopOpacity="1" />
          <Stop offset="1" stopColor={colors.green.hex} stopOpacity="0" />
        </LinearGradient>
      </Defs>
    );
  }
}