import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DimLevelOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import {Component, useState} from 'react';
import {
  TouchableOpacity,
  Text,
  View, Animated, Platform
} from "react-native";

import {colors, screenHeight, screenWidth, styles} from "../styles";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import Slider from "@react-native-community/slider";
import { Icon } from "../components/Icon";
import {SimpleOverlayBox} from "../components/overlays/SimpleOverlayBox";
import {OverlaySaveButton} from "./ListOverlay";

export class DimLevelOverlay extends LiveComponent<{data: any, componentId: any}, {visible:boolean}> {
  callback : any;

  dimmingValue = 0;

  constructor(props) {
    super(props);
    this.dimmingValue = props.data.initialValue;
    this.state = {
      // dimmingValue: props.data.initialValue,
      visible: false,
    };

    this.callback = props.data.callback;
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  _getSaveButton() {
    return (
      <OverlaySaveButton
        label={ lang("Save")}
        backgroundColor={colors.green.rgba(Platform.OS === 'android' ? 1 : 0.6)}
        callback={() => {
          this.callback(this.dimmingValue);
          this.close();
        }}
      />
    );
  }

  close() {
    this.callback = () => {};
    this.setState({
      visible:false,
    }, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
  }

  render() {
    return (
      <SimpleOverlayBox
        visible={this.state.visible}
        overrideBackButton={false}
        canClose={true}
        scrollable={false}
        closeCallback={() => { this.close(); }}
        title={ lang("Dim_how_much_") }
        footerComponent={this._getSaveButton()}
      >
        <View style={{flex:1, paddingTop:20}}>
          <View style={{height:40, alignItems:"center"}}>
          <Icon name={'ion5-ios-bulb'} size={40} color={colors.lightCsOrange.hex} /></View>
          <VerticalSlider
            indicator
            margin={10}
            initialValue={this.props.data.initialValue}
            callback={(value) => {
              this.dimmingValue = value;
          }} />
          <View style={{height:40, alignItems:"center"}}><Icon name={'md-moon'} size={25} color={colors.csBlue.hex} /></View>
        </View>
        <View style={{height:50}} />
      </SimpleOverlayBox>
    );
  }
}

export function VerticalSlider(props: {margin?: number, initialValue: number, callback: (value: number) => void, indicator: boolean}) {
  let [value, setValue] = useState(props.initialValue);
  let [width, setWidth] = useState(null);
  let [height, setHeight] = useState(null);
  let [initialized, setInitialized] = useState(false);

  return (
    <View style={{position:'relative', flex:1, alignItems:'center', justifyContent:'center', margin: props.margin ?? 0}} onLayout={(event) => {
      let {x, y, width, height} = event.nativeEvent.layout;
      setWidth(width);
      setHeight(height);
      setInitialized(true);
    }}>
      {initialized &&
        (
          <React.Fragment>
            <Slider
              style={{height: 40, width: height, transform: [{rotate: "-90deg"}] }}
              minimumValue={10}
              maximumValue={100}
              step={1}
              value={props.initialValue}
              minimumTrackTintColor={colors.gray.hex}
              maximumTrackTintColor={colors.gray.hex}
              onValueChange={(value) => {
                setValue(value);
                props.callback(value);
              }}
            />
            {props.indicator && <Indicator percentage={value} height={height} />}
          </React.Fragment>
        )
      }
    </View>
  );
}


function Indicator(props) {
    let percentage = props.percentage;
    let normalizedPercentage = 0.01*percentage;
    return (
      <View
        style={{
          position: "absolute",
          left: 50,
          top: Math.round((1-normalizedPercentage) * props.height),
          height: 40,
          width:  60,
          borderRadius: 10,
          backgroundColor: colors.black.rgba(0.2), ...styles.centered
        }}
      >
        <Text style={{
          color: colors.white.hex,
          fontSize: 18,
          fontWeight: "bold"
        }}>{lang("_", percentage)}</Text>
      </View>
    );
}

