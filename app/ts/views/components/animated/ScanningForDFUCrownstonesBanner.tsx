import { Component } from "react";
import * as React from "react";
import { colors} from "../../styles";
import { AnimatedIconBanner } from "./AnimatedIconBanner";

export class ScanningForDFUCrownstonesBanner extends Component<{height: number, componentId: any}, any> {
  render() {
    return (
      <AnimatedIconBanner
        componentId={this.props.componentId}
        height={this.props.height}
        icons={[
          { name: 'c2-crownstone', size: 80,  top: 15, left:135 },
          { name: 'c2-crownstone', size: 100, top: 25, left:215 },
          { name: 'c2-crownstone', size: 160, top:-32, left:-30 },
        ]}
        colors={[
          colors.darkPurple.rgba(0.25),
          colors.iosBlue.rgba(0.4),
          colors.green.rgba(0.4),
        ]}
      />
    );
  }
}
