import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity
} from "react-native";

import { styles, colors, screenWidth, LARGE_ROW_SIZE, NORMAL_ROW_SIZE, MID_ROW_SIZE } from "../../styles";
import { Icon } from "../Icon";


export class ButtonGetValue extends Component<any, any> {
  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = LARGE_ROW_SIZE;
    else if (this.props.mediumIcon)
      barHeight = MID_ROW_SIZE;
    else if (this.props.icon)
      barHeight = NORMAL_ROW_SIZE;

    let showValue = '.....'
    if (this.props.value) {
      showValue = this.props.value < 1 ? this.props.value.toFixed(this.props.digits || 4) : this.props.value
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
        <TouchableOpacity onPress={() => { this.props.getter() }}>
          <Text
            style={[{fontSize: 16, maxWidth: 0.65*screenWidth}, this.props.labelStyle, this.props.style]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.1}
          >
            { showValue }
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{alignItems: 'center', justifyContent:'flex-start', width: 0.15 * screenWidth}} onPress={() => { this.props.getter() }}>
          <Icon size={32} name={"md-arrow-down"} color={colors.blue.hex} />
        </TouchableOpacity>
      </View>
    );
  }
}
