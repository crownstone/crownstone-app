
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTimeCustomizationOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { colors, screenWidth, screenHeight } from "../styles";
import { core } from "../../Core";
import { ScaledImage } from "../components/ScaledImage";
import { AicoreTimeCustomization } from "../deviceViews/smartBehaviour/supportComponents/AicoreTimeCustomization";
import { xUtil } from "../../util/StandAloneUtil";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import {Alert, View} from "react-native";
import {SimpleOverlayBox} from "../components/overlays/SimpleOverlayBox";
import {AicoreUtil} from "../deviceViews/smartBehaviour/supportCode/AicoreUtil";
import {AicoreBehaviour} from "../deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import {OverlaySaveButton} from "./ListOverlay";

export class AicoreTimeCustomizationOverlay extends Component<any, any> {
  unsubscribe : any;
  callback : (any) => void;
  timeData : any;

  fromTime = null;
  toTime   = null;

  constructor(props) {
    super(props);
    this.state = { visible: false, showSaveButton: false};
    this.unsubscribe = [];

    this.timeData = props.data?.time ? xUtil.deepExtend({}, props.data.time) : null;
    this.callback = props.data?.callback;
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.eventBus.on("showAicoreTimeCustomizationOverlay", (data) => {
      this.callback = data.callback;
      this.timeData = data?.time ? xUtil.deepExtend({}, data.time) : null;
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

  getSaveButton() {
    if (this.state.showSaveButton) {
      return <OverlaySaveButton
        label={ lang("Looks_good_")}
        backgroundColor={colors.green.rgba(0.6)}
        callback={() => {
          if (AicoreUtil.isSameTime(this.fromTime, this.toTime)) {
            Alert.alert(
              lang("_The_start_and_ending_time_header"),
              lang("_The_start_and_ending_time_body"),
              [{text:lang("_The_start_and_ending_time_left")}])
          }
          else {
            let tempBehaviour = new AicoreBehaviour();
            tempBehaviour.insertTimeDataFrom(this.fromTime);
            tempBehaviour.insertTimeDataTo(this.toTime);
            this.callback(tempBehaviour.getTime());
            this.close();
          }
        }}
      />
    }
  }

  render() {
    return (
      <SimpleOverlayBox
        visible={this.state.visible}
        overrideBackButton={false}
        canClose={true}
        scrollable={true}
        closeCallback={() => { this.close(); }}
        backgroundColor={colors.white.rgba(0.2)}
        title={ lang("Time_Selection")}
        footerComponent={this.getSaveButton()}
      >
        <AicoreTimeCustomization
          timeData={this.timeData}
          setStoreButton={(state, fromTime, toTime) => {
            this.fromTime = fromTime;
            this.toTime = toTime;
            this.setState({showSaveButton: state})
          }}
        />
      </SimpleOverlayBox>
    );
  }
}



