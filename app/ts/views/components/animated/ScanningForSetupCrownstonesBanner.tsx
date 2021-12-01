import { Component } from "react";
import * as React from "react";
import { colors} from "../../styles";
import { AnimatedIconBanner } from "./AnimatedIconBanner";

export class ScanningForSetupCrownstonesBanner extends Component<{height: number, componentId: any}, any> {
  render() {
    return (
      <AnimatedIconBanner
        componentId={this.props.componentId}
        height={this.props.height}
        icons={[
          { name: 'c2-pluginFront', size: 100, top:-25, left:105 },
          { name: 'c2-pluginFront', size: 100, top: 25, left:175 },
          { name: 'c2-pluginFront', size: 160, top:-32, left:-30 },
        ]}
        colors={[
          colors.green.rgba(0.7),
          colors.iosBlue.rgba(0.3)
        ]}
      />
    );
  }
}
