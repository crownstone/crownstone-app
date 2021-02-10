import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DimLevelOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, Animated
} from "react-native";

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { colors, screenWidth, screenHeight, statusBarHeight, styles } from "../styles";
import { ScaledImage } from "../components/ScaledImage";
import { Separator } from "../components/Separator";
import { NavigationUtil } from "../../util/NavigationUtil";
import { DimmerSlider, DIMMING_INDICATOR_SIZE } from "../components/DimmerSlider";
import Slider from "@react-native-community/slider";
import { Icon } from "../components/Icon";
import { HiddenFadeInView } from "../components/animated/FadeInView";

export class DimLevelOverlay extends LiveComponent<{data: any, componentId: any}, {visible:boolean, dimmingValue: number}> {
  callback : any;

  constructor(props) {
    super(props);
    this.state = {
      dimmingValue: props.data.initialValue,
      visible: false,
    };

    this.callback = props.data.callback;
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  _getSaveButton() {
    return (
      <View style={{flex:1, flexDirection:'row'}}>
        <View style={{flex:1}} />
        <TouchableOpacity
          style={{height:50, flex:3, borderColor:colors.white.hex, borderWidth:2, backgroundColor: colors.green.hex, borderRadius: 20, alignItems: 'center', justifyContent:'center'}}
          onPress={() => {
            this.callback(this.state.dimmingValue);
            this.close();
          }}
        >
          <Text style={{fontSize:15, fontWeight:'bold'}}>{ lang("Save") }</Text>
        </TouchableOpacity>
        <View style={{flex:0.2}} />
      </View>
    )
  }

  close() {
    this.callback = () => {};
    this.setState({
      visible:false,
    }, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
  }

  render() {
    let idealAspectRatio = 1.75;
    let width = 0.85*screenWidth;
    let height = Math.min(width*idealAspectRatio, 0.9 * (screenHeight - statusBarHeight));

    let customContent = null;

    let slideWrapperHeight = height - Math.min(0.21*screenHeight,0.38 * screenWidth) - 80;
    let sliderHeight = slideWrapperHeight - 90;

    return (
      <OverlayBox
        visible={this.state.visible}
        height={height} width={width}
        overrideBackButton={false}
        canClose={true}
        scrollable={false}
        closeCallback={() => { this.close(); }}
        backgroundColor={colors.white.rgba(0.2)}
        getDesignElement={(innerSize) => { return (
          <ScaledImage source={require("../../images/overlayCircles/dimmingCircleGreen.png")} sourceWidth={600} sourceHeight={600} targetHeight={innerSize}/>
        );}}
        title={ lang("Dim_how_much_") }
        footerComponent={this._getSaveButton()}
      >
        <View style={{transform: [ { rotate: "-90deg" } ], width: slideWrapperHeight, height:200, flexDirection:'row', ...styles.centered}}>
          <Icon name={'md-moon'} size={25} color={colors.csBlue.hex} />
          <View style={{flex:1}}/>
          <IndicatorClass percentage={this.state.dimmingValue} range={sliderHeight} />
          <Slider
            style={{ width: sliderHeight, height: 20 }}
            minimumValue={10}
            maximumValue={100}
            step={ 1}
            value={this.state.dimmingValue}
            minimumTrackTintColor={colors.gray.hex}
            maximumTrackTintColor={colors.gray.hex}
            onValueChange={(value) => {
              this.setState({ dimmingValue: value })
            }}
          />
          <View style={{flex:1}}/>
          <Icon name={'md-sunny'} size={40} color={colors.lightCsOrange.hex} />
        </View>
        <View style={{height:50}} />
      </OverlayBox>
    );
  }
}


class IndicatorClass extends Component<any, any> {
  render() {
    let percentage = this.props.percentage;
    let width = 60;
    let height = 40;

    return (
      <View
        style={{
          position: "absolute",
          left: percentage*(this.props.range-30) / 90,
          top: 20,
          transform: [ { rotate: "90deg" } ],
          height: height,
          width: width,
          borderRadius: 10,
          backgroundColor: colors.black.rgba(0.2), ...styles.centered
        }}
      >
        <Text style={{
          color: colors.white.hex,
          fontSize: 18,
          fontWeight: "bold"
        }}>{lang("_", Math.round(this.props.percentage))}</Text>
      </View>
    );
  }
}
const Indicator = Animated.createAnimatedComponent(IndicatorClass);

