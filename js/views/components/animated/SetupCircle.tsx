
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,View
} from "react-native";

import { colors, styles } from "../../styles";
import { core } from "../../../core";

import { Svg, Circle } from 'react-native-svg';

export class SetupCircle extends Component<any, any> {
  borderWidth
  innerDiameter
  outerDiameter
  iconSize
  textSize
  unsubscribeSetupEvents = [];
  constructor(props) {
    super(props);

    this.state = {
      setupProgress: 5,
    };

    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 10;
    this.innerDiameter = 2 * props.radius - 4.5 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;
  }

  componentDidMount(): void {
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupCancelled", (handle) => {
      this.setState({setupProgress: 0});
    }));
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupInProgress", (data) => {
      this.setState({setupProgress: data.progress});
    }));
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupComplete", (handle) => {
      this.setState({setupProgress: 20});
    }));
  }

  componentWillUnmount(): void {
    this.unsubscribeSetupEvents.forEach((unsub) => { unsub(); })
  }


  render() {
    let pathLength = Math.PI * 2 * (this.props.radius - this.borderWidth);
    let levelProgress = this.state.setupProgress / 20;
    return (
      <View style={{...styles.centered, flex:1}}>
          <View style={{position:'absolute', top:0, left:0}}>
          <Svg width={this.outerDiameter} height={this.outerDiameter}>
            <Circle
              r={this.props.radius - this.borderWidth}
              stroke={colors.csOrange.hex}
              strokeWidth={this.borderWidth}
              x={this.props.radius}
              y={this.props.radius}
              strokeLinecap="round"
              fill={colors.csBlue.hex}
            />
            <Circle
              r={this.props.radius - this.borderWidth}
              stroke={colors.green.hex}
              strokeWidth={this.borderWidth}
              strokeDasharray={[pathLength*levelProgress,pathLength]}
              rotation="-89.9"
              x={this.props.radius}
              y={this.props.radius}
              strokeLinecap="round"
              fill="rgba(0,0,0,0)"
            />
          </Svg>
        </View>
        <Text style={{color:colors.white.hex, fontSize:35, fontWeight:'bold'}}>{Math.round(levelProgress*100) + " %"}</Text>
      </View>
    )
  }
}