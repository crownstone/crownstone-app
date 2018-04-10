import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Platform,
  View
} from 'react-native';
import { styles, colors } from '../../../styles'
import {
  Svg,
  Circle,
  ClipPath,
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
  Stop,
  Use,
  Text,
  Defs,
} from 'react-native-svg';

export class GraphAxis extends Component<any, any> {
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.options !== nextProps.options;
  }

  render() {
    let elements = [];
    let options = this.props.options;
    let maxX = options.width-options.padding;
    let minX = options.padding;
    let maxY = options.height-options.paddingBottom;
    let minY = options.padding;

    let padding = 10;

    let minXfx = minX - padding;
    let maxXfx = maxX + padding;
    let minYfx = minY - padding;
    let maxYfx = maxY + padding;

    let baseColor = colors.white.hex;
    let accentColor = colors.csOrange.hex;

    elements.push(<Line key="bottomGridBarBackOrange"      x1={minXfx+2} y1={maxY+2  } x2={maxXfx-2}      y2={maxY+2}   stroke={accentColor}  strokeOpacity={0.55} />);
    elements.push(<Line key="bottomGridBarBackFull"        x1={0       } y1={maxY    } x2={options.width} y2={maxY}     stroke={baseColor}    strokeOpacity={0.2 } />);
    elements.push(<Line key="bottomGridBarBackFullOrange"  x1={0       } y1={maxY+2  } x2={options.width} y2={maxY+2}   stroke={accentColor}  strokeOpacity={0.2 } />);
    elements.push(<Line key="bottomGridBarBack"            x1={minXfx  } y1={maxY    } x2={maxXfx}        y2={maxY}     stroke={baseColor}    strokeOpacity={0.4 } />);
    elements.push(<Line key="bottomGridBar"                x1={minX    } y1={maxY    } x2={maxX}          y2={maxY}     stroke={baseColor}    strokeOpacity={1   } />);
    elements.push(<Line key="bottomGridBarOrange"          x1={minX    } y1={maxY+2  } x2={maxX}          y2={maxY+2}   stroke={accentColor}  strokeOpacity={1   } />);
    elements.push(<Line key="sideGridBarBackOrange"        x1={minX-2  } y1={minYfx+2} x2={minX-2}        y2={maxYfx-2} stroke={accentColor}  strokeOpacity={0.55} />);
    elements.push(<Line key="sideGridBarBack"              x1={minX    } y1={minYfx  } x2={minX}          y2={maxYfx}   stroke={baseColor}    strokeOpacity={0.4 } />);
    elements.push(<Line key="sideGridBarOrange"            x1={minX-2  } y1={minY    } x2={minX-2}        y2={maxY}     stroke={accentColor}  strokeOpacity={1   } />);
    elements.push(<Line key="sideGridBar"                  x1={minX    } y1={minY    } x2={minX}          y2={maxY}     stroke={baseColor}    strokeOpacity={1   } />);

    elements.push(<Text key={'UNIT'} x={options.padding} y={11} originX={0} fontSize={11} fontWeight="bold" fill={colors.white.hex} textAnchor="end" >{'(W)'}</Text>);

    return (
      <View style={{position:'absolute', top:0, left:0}}>
        <Svg key={'baseAxisSvg'} width={options.width} height={options.height}>
          {elements}
        </Svg>
      </View>
    );
  }
}