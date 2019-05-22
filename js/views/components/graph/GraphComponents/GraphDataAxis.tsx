
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("GraphDataAxis", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';
import { colors } from '../../../styles'
import {
  Svg,
  Line,
  Text,
  } from 'react-native-svg';

export class GraphDataAxis extends Component<any, any> {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.datastepLines !== nextProps.dataStepLines ||
      this.props.options !== nextProps.options
    )
  }

  render() {
    let elements = [];
    let options = this.props.options;
    for (let i = 0; i < this.props.datastepLines.length; i++) {
      let line = this.props.datastepLines[i];
      let lineY = line.y + options.padding;

      // do not interfere with the (W) unit annotation
      if (lineY < 15) {
        continue;
      }

      elements.push(<Text key={'datalabel' + line.val} x={options.padding - 8} y={lineY + 5} fontSize={11} fill={colors.white.hex} textAnchor="end" >{line.val}</Text>);
      elements.push(<Line key={'dataline' + line.val} x1={options.padding} y1={lineY} x2={options.width} y2={lineY} stroke={colors.white.hex}  strokeOpacity={0.1}/>);
      elements.push(<Line key={'dataline' + line.val + "_sub"} x1={options.padding} y1={lineY} x2={options.width - options.padding} y2={lineY} stroke={colors.white.hex}  strokeOpacity={0.2} />);
    }

    return (
      <View style={{position:'absolute', top:0, left:0}}>
        <Svg key={'dataAxisSvg'} width={options.width} height={options.height}>
          {elements}
        </Svg>
      </View>
    );
  }
}

