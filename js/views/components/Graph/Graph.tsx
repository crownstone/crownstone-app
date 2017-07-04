import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Platform,
  View
} from 'react-native';
import { Icon } from '../Icon'
import { styles, colors } from '../../styles'
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
import { GraphingEngine } from "../../../logic/GraphingEngine";
import { Util } from "../../../util/Util";
import { TimeStep } from './TimeStep'
import { DataStep } from './DataStep'

let RANGE = 40000; // ms
let OVERSHOOT = 4000; // ms

export class Graph extends Component<any, any> {
  data : any[] = [];
  options : any;
  interval : any;

  shownTimes : any = {};
  shownTimesArray : any = [];
  times = [];

  range = {start: new Date(), end: new Date()};
  maxY = 0;

  dataStepLines : any[] = [];

  padding = 30;
  paddingBottom = 50;

  constructor(props) {
    super();

    this.options = {
      interpolation: {
        enabled: false,
        parametrization: 'centripetal', // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
      },
      shaded: {
        enabled: true,
        orientation: 'bottom' // top, bottom
      },
      height: props.height,
      width: props.width,
      padding: this.padding,
      paddingBottom: this.paddingBottom,
      labels: {
        enabled: true,
        alternating: false
      }
    };

    if (props.options) {
      this.setOptions(props.options);
    }
  }

  componentWillMount() {
    let now = new Date().valueOf();
    this.range.start = new Date(now - RANGE);
    this.range.end   = new Date(now + OVERSHOOT);
  }

  componentDidMount() {
    this.loadData();
    let redraw = () => {
      let now = new Date().valueOf();
      this.range.start = new Date(now - RANGE);
      this.range.end   = new Date(now + OVERSHOOT);

      this.forceUpdate();
      this.interval = requestAnimationFrame(() => {
        redraw();
      });
    };
    redraw();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.interval)
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props.data !== nextProps.data) {
      let now = new Date().valueOf();
      this.range.start = new Date(now - RANGE);
      this.range.end   = new Date(now + OVERSHOOT);
      this.loadData();
    }
  }

  setOptions(options) {
    if (!options) {
      return;
    }

    if (options.interpolation === true || options.interpolation === false) {
      options.interpolation = {enabled: options.interpolation};
    }
    if (options.shaded === true || options.shaded === false) {
      options.shaded = {enabled: options.shaded};
    }
    if (options.labels === true || options.labels === false) {
      options.labels = {enabled: options.labels};
    }

    Util.deepExtend(options, this.options);
  }

  loadData() {
    // console.time("loadData")
    this.data = [];
    if (this.props.data) {
      for (let i = 0; i < this.props.data.length; i++) {
        if (this.props.data[i][this.props.xField] > new Date().valueOf() - 1.25 * RANGE) {
          this.data.push({
            x:  this.props.data[i][this.props.xField],
            tx: this.props.data[i][this.props.xField],
            y:  this.props.data[i][this.props.yField],
            oy: this.props.data[i][this.props.yField]
          });
        }
      }

      if (this.data.length > 0) {
        // GraphingEngine.transformXToFit(this.data, this.options);
        this.maxY = GraphingEngine.transformYToFit(this.data, this.options);
      }

      // precalc the datastep spacing
      let dataStep = new DataStep(0, this.maxY, this.options.height- this.options.padding - this.options.paddingBottom, 25);
      this.dataStepLines = dataStep.getLines();

    }
    else {
      let dataStep = new DataStep(0, 50, this.options.height - this.options.padding - this.options.paddingBottom, 25);
      this.dataStepLines = dataStep.getLines();
    }
    // console.timeEnd("loadData")
  }

  _transformDataToScreen() {
    if (this.data && this.data.length > 0) {
      let startTimestamp = this.range.start.valueOf();
      let timeRange = this.range.end.valueOf() - startTimestamp; //ms
      let factor = this.props.width / timeRange;

      for (let i = 0; i < this.data.length; i++) {
        this.data[i].x = (this.data[i].tx - startTimestamp) * factor;
      }
    }
  }

  _getCurves() {
    if (this.data && this.data.length > 0) {
      let type = "L";
      if (this.options.interpolation.enabled === true){
        type = "C";
      }

      let pathArray = GraphingEngine.calcPath(this.data, this.options);
      let shadingPath = GraphingEngine.getShadingPath(pathArray, this.options);
      let linePath = 'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " + GraphingEngine.serializePath(pathArray, type, false);


      let items = [];

      if (this.options.shaded.enabled === true) {
        items.push(
          <Path
            key="path_fill"
            type={type}
            d={shadingPath}
            fill="url(#grad)"
            fillOpacity={1}
            clipPath="url(#showBody)"
          />
        );
      }

      items.push(
        <Path
          key="path1"
          type={type}
          d={linePath}
          stroke="white"
          fillOpacity={0}
          strokeWidth={2}
          strokeLinecap="round"
          clipPath="url(#showBody)"
        />
      );
      return items;
    }
  }

  _getPoints() {
    let points = [];
    let opacity = 1;
    let fadeThreshold = 12;
    let dx = this.options.padding - fadeThreshold;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].x < dx) {
        continue;
      }

      opacity = 1;
      if (this.data[i].x < this.options.padding) {
        opacity = (this.data[i].x-dx)/fadeThreshold;
        opacity *= opacity;
      }
      points.push(
        <Circle
          key={'point' + i}
          r={3}
          x={this.data[i].x}
          y={this.data[i].y}
          fill={colors.csOrange.hex}
          stroke={colors.white.hex}
          strokeWidth={1.5}
          strokeOpacity={opacity}
          fillOpacity={opacity}
        />
      );
    }
    return points;
  }

  render() {
    // console.time("RenderGraph");
    // console.timeEnd("RenderGraph")

    this._transformDataToScreen();

    return (
      <View style={{position:'relative', top:0, left:0, width: this.props.width, height: this.props.height}}>
        <Svg width={this.props.width} height={this.props.height} style={{position:'absolute', top:0, left:0, width: this.props.width, height: this.props.height}}>
          <GraphDefs
            options={this.options}
          />
          {this._getCurves()}
          {this._getPoints()}
        </Svg>
        <GraphDataAxis
          options={this.options}
          datastepLines={this.dataStepLines}
        />
        <GraphAxis
          options={this.options}
        />
        <GraphTimeline
          range={this.range}
          options={this.options}
        />
      </View>
    );
  }
}



class GraphDataAxis extends Component<any, any> {
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

      elements.push(<Text key={'datalabel' + line.val} x={options.padding - 8} y={lineY - 6} fontSize={11} fill={colors.white.hex} textAnchor="end" >{line.val}</Text>);
      elements.push(<Line key={'dataline' + line.val} x1={options.padding} y1={lineY} x2={options.width} y2={lineY} stroke={colors.white.hex}  strokeOpacity={0.1}/>);
      elements.push(<Line key={'dataline' + line.val + "_sub"} x1={options.padding} y1={lineY} x2={options.width - options.padding} y2={lineY} stroke={colors.white.hex}  strokeOpacity={0.2} />);
    }

    return (
      <Svg key={'dataAxisSvg'} width={options.width} height={options.height} style={{position:'absolute', top:0, left:0}}>
        {elements}
      </Svg>
    );
  }
}

class GraphDefs extends Component<any, any> {
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.options !== nextProps.options;
  }

  render() {
    let options = this.props.options;
    return (
      <Defs key="GradientDiff">
        <ClipPath id="showBody">
          <Rect x={options.padding} y={0} width={options.width} height={options.height} />
        </ClipPath>
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

class GraphAxis extends Component<any, any> {
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

    elements.push(<Text key={'UNIT'} x={options.padding} y={0} fontSize={11} fontWeight="bold" fill={colors.white.hex} textAnchor="end" >{'(W)'}</Text>);

    return (
      <Svg key={'baseAxisSvg'} width={options.width} height={options.height} style={{position:'absolute', top:0, left:0}}>
        {elements}
      </Svg>
    );
  }
}

class GraphTimeline extends Component<any, any> {
  timePaddingFactor = 2;
  startTimeStamp = 0;
  endTimeStamp = 0;
  _leftValue = 0;

  constructor(props) {
    super();
    this.state = { left: new Animated.Value(-props.options.width*(1+2*this.timePaddingFactor))};
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.options !== nextProps.options) {
      return true;
    }

    let newStart = nextProps.range.start.valueOf();
    let newEnd = nextProps.range.end.valueOf();
    let newTimeRange = newEnd-newStart; //ms
    if (newStart > this.startTimeStamp && newEnd < this.endTimeStamp) {
      let timeRange = this.endTimeStamp - this.startTimeStamp;


      if (timeRange / newTimeRange !== (1 + 2*this.timePaddingFactor)) {
        console.log("Redrawing for scale effect");
        return true;
      }

      let timeOffset = newStart - this.startTimeStamp;
      let xOffset = (timeOffset / timeRange) * this.props.options.width*(1+2*this.timePaddingFactor);

      this.state.left.setValue(-xOffset);
      return false;
    }

    this.startTimeStamp = newStart - this.timePaddingFactor*newTimeRange;
    this.endTimeStamp = newEnd + this.timePaddingFactor*newTimeRange;

    this.state.left.setValue(-this.props.options.width*(1+2*this.timePaddingFactor));

    // this.forceUpdate();
    return true;
  }

  _getElements(options) {
    let elements = [];
    
    let maxY = options.height-options.paddingBottom;
    let minY = options.padding;

    let padding = 10;

    let minYfx = minY - padding;

    let timeRange = this.props.range.end.valueOf()-this.props.range.start.valueOf(); //ms
    let factor = options.width / timeRange;
    let ty = maxY + 20;

    this.startTimeStamp = this.props.range.start.valueOf() - this.timePaddingFactor*timeRange;
    this.endTimeStamp = this.props.range.end.valueOf() + this.timePaddingFactor*timeRange;

    let step = new TimeStep(new Date(this.startTimeStamp), new Date(this.endTimeStamp), 30 / factor);

    let _toScreen = (t) => {
      return (t.valueOf() - this.startTimeStamp) * options.width / timeRange;
    };

    let current;
    let x;
    let label;
    let isMajor;
    let labelMinor;
    let count = 0;
    const MAX = 1000;
    let color = colors.white.hex;

    step.start();
    while (step.hasNext() && count < MAX) {
      step.next();

      count++;

      isMajor = step.isMajor();
      labelMinor = step.getLabelMinor();

      current = step.getCurrent();
      x = _toScreen(current);

      label = Util.getTimeFormat(current.valueOf());

      if (isMajor) {
        elements.push(<Text key={'bottomStepLabel' + label} x={x-20} y={ty} originX={x-20} originY={ty} fontSize={11} fill={color} fillOpacity={0.75} textAnchor="middle" rotate="-45">{label}</Text>);
        elements.push(<Line key={'bottomStep' + label} x1={x} y1={minYfx} x2={x} y2={maxY} stroke={color} strokeOpacity={0.1}  stroke-width={2} strokeLinecap="round"/>);
      }
      else { // minor line
        elements.push(<Text key={'bottomStepLabel' + label} x={x-20} y={ty} originX={x-20} originY={ty} fontSize={11} fill={color} fillOpacity={0.3} textAnchor="middle" rotate="-45">{label}</Text>);
        elements.push(<Line key={'bottomStep' + label + "_sub"} x1={x} y1={minYfx} x2={x} y2={maxY}  stroke={color} strokeOpacity={0.1} stroke-width={1} strokeLinecap="round"/>);
      }
    }

    return elements;
  }

  render() {
    let options = this.props.options;
    let fullWidth = (1 + (2*this.timePaddingFactor)) * options.width;
    return (
      <View style={{width: options.width, height: options.height, overflow: 'hidden', position:'relative'}}>
        <Animated.View style={{width: fullWidth, height: options.height, overflow: 'hidden', position:'absolute', top:0, left: this.state.left}}>
          <Svg key={'timelineSvg'} width={fullWidth} height={options.height}>
            {this._getElements(options)}
          </Svg>
        </Animated.View>
      </View>
    );
  }
}

