
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Dropdown", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { SlideFadeInView }  from '../animated/SlideFadeInView'
import {styles, colors, screenWidth, NORMAL_ROW_SIZE, LARGE_ROW_SIZE, MID_ROW_SIZE, menuStyles} from "../../styles";
import { Picker } from "@react-native-community/picker";


export class Dropdown extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {open:false, value: props.value};
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

  getItems() {
    let items = [];
    let counter = 0;
    this.props.items.forEach((item) => {
      items.push(<Picker.Item
        label={item.label}
        value={item.value === undefined ? item.label : item.value}
        key={counter + "_dropdown_" + this.props.label}
        testID={item.value === undefined ? item.label : item.value}
      />);
      counter += 1;
    });
    return items;
  }

  _getButtonBar() {
    if (this.props.buttons === true) {
      return (
        <View style={{
          position:'absolute',
          flex:1,
          top:0,
          width: screenWidth,
          flexDirection:'row',
          height:50,
          backgroundColor:'#fff',
          justifyContent:'center',
          borderColor:colors.lightGray.hex,
          borderBottomWidth:1
        }}>
          <TouchableOpacity style={{flex:1, justifyContent:'center', alignItems:'flex-start', paddingLeft:15}} onPress={() => {
            this.setState({value: this.props.value, open: false});
          }}>
            <Text style={{fontSize:16, color:colors.blue3.hex}}>{ lang("Cancel") }</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{flex:1, justifyContent:'center', alignItems:'flex-end', paddingRight:15}} onPress={() => {
            this.setState({open: false});
            this.props.callback(this.state.value);
          }}>
            <Text style={{fontSize:16, color:colors.blue3.hex}}>{ lang("Done") }</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  _getPicker() {
    if (Platform.OS === 'android') {
      return (
        <Picker
          selectedValue={this.props.value}
          onValueChange={(newValue) => { this.props.callback(newValue); }}
        >
        {this.getItems()}
      </Picker>
    );

    }
    else {  // iOS
      let callback = (value) => {
        if (this.props.buttons !== true) {
          this.setState({open: false, value: value});
          this.props.callback(value);
        }
        else {
          this.setState({value: value})
        }
      };
      return (
        <Picker key={this.props.key || this.props.label || undefined} selectedValue={this.state.value} onValueChange={callback} style={{position:'relative', top: this.props.buttons === true ? 50 : 0}}>
          {this.getItems()}
        </Picker>
      )
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

    if (Platform.OS === 'android') {
      return (
        <View>
          <View style={[menuStyles.listView, {height:this.props.barHeight}]}>
            <Text style={[menuStyles.listText, this.props.labelStyle]}>{this.props.label}</Text>
            <View style={{flex:1}}>
              {this._getPicker()}
            </View>
          </View>
        </View>
      );
    }
    else {
      return (
        <View>
          <TouchableOpacity onPress={() => {
            if (this.state.open === true) {
              this.props.callback(this.state.value);
            }
            this.setState({open:!this.state.open});
          }} testID={this.props.testID}>
            <View style={[menuStyles.listView, {height: navBarHeight}]}>
              {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
              {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
              {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
              {this.props.valueRight === true ?
                <Text style={[menuStyles.valueText, this.props.labelStyle]}>{this.props.label}</Text>
                :
                <Text style={[menuStyles.listText, this.props.labelStyle]}>{this.props.label}</Text>
              }
              <Text style={[{flex:1, fontSize:16 }, this.props.valueStyle]}>{this.getLabelIfPossible()}</Text>
            </View>
          </TouchableOpacity>
          <SlideFadeInView height={totalHeight} visible={this.state.open === true}  style={{backgroundColor: menuStyles.listView.backgroundColor}}>
            <View style={{position:'relative', top: -0.5*(dropHeight - navBarHeight), height: dropHeight}}>
              {this._getPicker()}
            </View>
            {this._getButtonBar()}
          </SlideFadeInView>
        </View>
      );
    }
  }
}
