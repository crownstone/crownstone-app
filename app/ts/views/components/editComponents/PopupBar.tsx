
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Dropdown", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from "react-native";

import {styles, screenWidth, NORMAL_ROW_SIZE, LARGE_ROW_SIZE, MID_ROW_SIZE, menuStyles} from "../../styles";
import { core } from "../../../Core";


export class PopupBar extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.value !== this.props.value) {
      this.setState({value: this.props.value});
    }
  }

  getLabelIfPossible() {
    if (this.props.valueLabel) {
      return this.props.valueLabel;
    }

    for (let i = 0; i < this.props.items.length; i++) {
      let item = this.props.items[i];
      if (item.value !== undefined && item.value === this.state.value) {
        if (item.label !== undefined) {
          return item.label;
        }
        else {
          return item.value;
        }
      }
    }
    for (let i = 0; i < this.props.items.length; i++) {
      let item = this.props.items[i];
       if (item.label !== undefined && item.label === this.state.value) {
        if (item.label !== undefined) {
          return item.label;
        }
        else {
          return item.value;
        }
      }
    }
  }


  render() {
    let navBarHeight = this.props.barHeight || NORMAL_ROW_SIZE;
    if (this.props.largeIcon || this.props.size === "large")        { navBarHeight = LARGE_ROW_SIZE; }
    else if (this.props.mediumIcon || this.props.size === "medium") { navBarHeight = MID_ROW_SIZE; }
    else if (this.props.icon)                                       { navBarHeight = NORMAL_ROW_SIZE; }

    let dropHeight = this.props.dropdownHeight || 216;
    let totalHeight = dropHeight;
    if (this.props.buttons === true) {
      totalHeight += 50;
    }

    let buttons = [];
    this.props.items.forEach((data) => {
      buttons.push({text: data.label, callback: () => { this.props.callback(data.value); }})
    })

    return (
      <View>
        <TouchableOpacity onPress={() => { core.eventBus.emit("showPopup", {buttons}); }}>
          <View style={[menuStyles.listView, {height: navBarHeight}]}>
            {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
            {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
            {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
            {this.props.valueRight === true ?
              <Text style={[{fontSize:16}, this.props.labelStyle]}>{this.props.label}</Text>
              :
              <Text style={[menuStyles.listText, this.props.labelStyle]}>{this.props.label}</Text>
            }
            <Text style={[{flex:1, fontSize:16 }, this.props.valueStyle]}>{this.getLabelIfPossible()}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}
