
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTimeCustomizationOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { colors, screenWidth, screenHeight } from "../styles";
import { core } from "../../core";
import { ScaledImage } from "../components/ScaledImage";
import { AicoreTimeCustomization } from "../deviceViews/smartBehaviour/supportComponents/AicoreTimeCustomization";
import { xUtil } from "../../util/StandAloneUtil";
import { NavigationUtil } from "../../util/NavigationUtil";

export class AicoreTimeCustomizationOverlay extends Component<any, any> {
  unsubscribe : any;
  callback : (any) => void;
  timeData : any;

  constructor(props) {
    super(props);
    this.state = { visible: false };
    this.unsubscribe = [];

    this.timeData = props.data.time ? xUtil.deepExtend({}, props.data.time) : null;
    this.callback = props.data.callback;
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.eventBus.on("showAicoreTimeCustomizationOverlay", (data) => {
      this.callback = data.callback;
      this.timeData = data.time ? xUtil.deepExtend({}, data.time) : null;
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  close() {
    this.callback = () => {};
    this.timeData = {};
    this.setState({
      visible:false,
    }, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
  }

  render() {
    let idealAspectRatio = 1.85;
    let width = 0.85*screenWidth;
    let height = Math.min(width*idealAspectRatio, 0.9 * screenHeight);

    return (
      <OverlayBox
        visible={this.state.visible}
        height={height} width={width}
        overrideBackButton={false}
        canClose={true}
        scrollable={true}
        closeCallback={() => { this.close(); }}
        backgroundColor={colors.white.rgba(0.6)}
        getDesignElement={(innerSize) => { return (
          <ScaledImage source={require('../../images/overlayCircles/time.png')} sourceWidth={600} sourceHeight={600} targetHeight={innerSize}/>
        );}}
        title={ lang("Time_Selection")}
      >
        <AicoreTimeCustomization width={width} timeData={this.timeData} save={(newTimeData) => {
          this.callback(newTimeData);
          this.close();
        }}/>
      </OverlayBox>
    );
  }
}



