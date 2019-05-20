import { Component } from "react";
import * as React from "react";
import { colors, screenWidth } from "../../styles";
import { AnimatedIconBanner } from "./AnimatedIconBanner";

export class BatchDFUCrownstonesBanner extends Component<{height: number}, any> {
  render() {
    return (
      <AnimatedIconBanner
        height={this.props.height}
        icons={[
          { name: "ios-construct", size: 90,  top:-15, left:130 },
          { name: "ios-bluetooth", size: 100, top: 32, left:245 },
          { name: "ios-home"     , size: 170, top:-28, left:-20 },
        ]}
        colors={[
          colors.darkPurple.rgba(0.4),
          colors.iosBlue.rgba(0.4),
          colors.green.rgba(0.6),
        ]}
      />
    );
  }
}
