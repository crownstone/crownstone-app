import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Graph", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  View
} from 'react-native';
import { colors } from '../../styles'
import {
  Svg,
  Circle,
  Path,
  } from 'react-native-svg';
import { GraphingEngine } from "../../../logic/GraphingEngine";
import { DataStep }       from './GraphComponents/DataStep'
import { GraphDefs }      from "./GraphComponents/GraphDefs";
import { GraphDataAxis }  from "./GraphComponents/GraphDataAxis";
import { GraphTimeline }  from './GraphComponents/GraphTimeline';
import { GraphAxis }      from "./GraphComponents/GraphAxis";
import { xUtil } from "../../../util/StandAloneUtil";

let RANGE = 40000; // ms
let OVERSHOOT = 4000; // ms

export class Graph extends LiveComponent<{
  width: number,
  height: number,
  data: GraphData[],
  dataHash: any,
  live?: boolean,
  autofit?: boolean,
  dataAxis?: boolean,
  options?:any,
  fade?:boolean,
  showPoints?:boolean,
  lineColor?:string,
  hideUI? : boolean,
  rangeStartsAtZero? : boolean,
  minimumRange? : number,
}, any> {
  data : any[] = [];
  options : any;
  interval : any;
  times = [];

  range = {start: Date.now(), end: Date.now()};
  maxY = 0;
  minY = 0;

  dataStepLines : any[] = [];

  padding = 30;
  paddingBottom = 50;

  constructor(props) {
    super(props);

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

    this.setRange()
  }


  componentDidMount() {
    let redraw = () => {
      this.setRange();
      this.interval = requestAnimationFrame(() => {
        redraw();
        this.forceUpdate()
      });
    };

    if (this.props.live !== false) {
      redraw();
    }
    else {
      this.setRange();
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.interval)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.dataHash !== this.props.dataHash) {
      this.setRange();
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

    xUtil.deepExtend(this.options, options);
  }

  setRange() {
    if (this.props.autofit) {
      let min = 1e9;
      let max = -1e9;
      for (let i = 0; i < this.props.data.length; i++) {
        min = Math.min(this.props.data[i].x, min);
        max = Math.max(this.props.data[i].x, max);
      }
      this.range.start = min;
      this.range.end = max;
    }
    else {
      let now = Date.now();
      this.range.start = new Date(now - RANGE).valueOf();
      this.range.end = new Date(now + OVERSHOOT).valueOf();
    }
    this.loadData();
  }

  loadData() {
    // console.time("loadData")
    this.data = [];
    if (this.props.data) {
      for (let i = 0; i < this.props.data.length; i++) {
        if (this.props.data[i].x > Date.now() - 1.25 * RANGE || this.props.live === false) {
          this.data.push({
            x:  this.props.data[i].x,
            tx: this.props.data[i].x,
            y:  this.props.data[i].y,
            oy: this.props.data[i].y
          });
        }
      }

      if (this.data.length > 0) {
        // GraphingEngine.transformXToFit(this.data, this.options);
        // precalc the datastep spacing
        let minY = 1e9;
        let maxY = -1e9;
        if (this.props.rangeStartsAtZero) {
          minY = 0;
        }

        if (this.props.minimumRange) {
          maxY = this.props.minimumRange;
        }
        [this.minY, this.maxY] = GraphingEngine.transformYToFit(this.data, this.options, minY, maxY);
      }

      let dataStep = new DataStep(this.minY, this.maxY, this.options.height- this.options.padding - this.options.paddingBottom, 25);
      this.dataStepLines = dataStep.getLines();

    }
    else {
      let dataStep = new DataStep(0, 40, this.options.height - this.options.padding - this.options.paddingBottom, 25);
      this.dataStepLines = dataStep.getLines();
    }
    // console.timeEnd("loadData")
  }

  _transformDataToScreen() {
    if (this.data && this.data.length > 0) {
      let startTimestamp = this.range.start;
      let timeRange = this.range.end - startTimestamp; //ms
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
          d={linePath}
          stroke={ this.props.lineColor || "white" }
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

    if (this.props.showPoints === false) {
      return points;
    }

    let opacity = 1;
    let fadeThreshold = 12;
    let dx = this.options.padding - fadeThreshold;
    for (let i = 0; i < this.data.length; i++) {
      opacity = 1;
      if (this.props.fade !== false) {
        if (this.data[i].x < dx) {
          continue;
        }
        if (this.data[i].x < this.options.padding) {
          opacity = (this.data[i].x-dx)/fadeThreshold;
          opacity *= opacity;
        }
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
        <View style={{position:'absolute', top:0, left:0}}>
          <Svg
            width={this.props.width}
            height={this.props.height}
          >
            <GraphDefs
              hideFadeArea={this.props.fade === false}
              options={this.options}
            />
            {this._getCurves()}
            {this._getPoints()}
          </Svg>
        </View>
        { this.props.hideUI !== true && <GraphDataAxis
          options={this.options}
          datastepLines={this.dataStepLines}
          color={colors.csBlue.hex}
        />}
        { this.props.hideUI !== true && <GraphAxis
          options={this.options}
          color={colors.csBlue.hex}
        />}
        { this.props.hideUI !== true && <GraphTimeline
          range={this.range}
          options={this.options}
          color={colors.csBlue.hex}
        />}
      </View>
    );
  }
}








