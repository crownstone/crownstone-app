import { LiveComponent }          from "../../../LiveComponent";

import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("GraphTimeline", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Animated,
  View
} from 'react-native';
import { colors } from '../../../styles'
import {
  Svg,
  Line,
  Text,
  } from 'react-native-svg';
import { Util } from "../../../../util/Util";
import { TimeStep } from './TimeStep'

export class GraphTimeline extends LiveComponent<any, any> {
  timePaddingFactor = 2;
  startTimeStamp = 0;
  endTimeStamp = 0;
  _leftValue = 0;

  constructor(props) {
    super(props);
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
    let ty = maxY + 30;

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
        elements.push(<Text key={'bottomStepLabel' + label} x={x-20} y={ty} originX={x-20} originY={ty} fontSize={11} fill={color} fillOpacity={0.75} textAnchor="middle" rotation="-45">{label}</Text>);
        elements.push(<Line key={'bottomStep' + label} x1={x} y1={minYfx} x2={x} y2={maxY} stroke={color} strokeOpacity={0.1}  stroke-width={2} strokeLinecap="round"/>);
      }
      else { // minor line
        elements.push(<Text key={'bottomStepLabel' + label} x={x-20} y={ty} originX={x-20} originY={ty} fontSize={11} fill={color} fillOpacity={0.3} textAnchor="middle" rotation="-45">{label}</Text>);
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
