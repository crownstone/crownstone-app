
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NumericSet", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity
} from "react-native";

import { styles, colors, screenWidth, LARGE_ROW_SIZE, NORMAL_ROW_SIZE, MID_ROW_SIZE } from "../../styles";
import { Icon } from "../Icon";
import { core } from "../../../Core";

const DEFAULT_VALUE = '.....';
export class NumericSet extends Component<any, any> {
  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = LARGE_ROW_SIZE;
    else if (this.props.mediumIcon)
      barHeight = MID_ROW_SIZE;
    else if (this.props.icon)
      barHeight = NORMAL_ROW_SIZE;

    let showValue = DEFAULT_VALUE;
    if (this.props.value !== null && this.props.value !== undefined) {
      let numericValue = Number(this.props.value);
      showValue = numericValue < 1 ? numericValue.toFixed(this.props.digits || 4) : String(numericValue)
    }

    return (
      <View style={[styles.listView, {height: barHeight, backgroundColor: this.props.buttonBackground || '#ffffff', width: screenWidth}]}>
        <Text
          style={[styles.listTextLarge, this.props.labelStyle, this.props.style, {minWidth: 0.2*screenWidth, paddingRight:5}]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75}
          ellipsizeMode={'tail'}
        >
          {this.props.label}
        </Text>
        <Text
          style={[{fontSize: 16, maxWidth: 0.5*screenWidth}, this.props.labelStyle, this.props.style]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.1}
        >
          { showValue }
        </Text>
        <TouchableOpacity style={{alignItems: 'center', justifyContent:'flex-end', width: 0.15 * screenWidth}} onPress={() => {
          core.eventBus.emit("showNumericOverlay",{
            value: showValue === DEFAULT_VALUE ? '' : String(showValue),
            title: lang("SET_",this.props.label),
            text: "Input a number and press set, or close this window.",
            callback: this.props.setCallback
          })
        }}>
          <Icon size={32} name={"md-arrow-up"} color={colors.green.hex} />
        </TouchableOpacity>
      </View>
    );
  }
}
