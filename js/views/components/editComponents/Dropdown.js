import React, { Component } from 'react'
import {
  Picker,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { SlideFadeInView }  from './../animated/SlideFadeInView'
import { styles, colors } from '../../styles'


export class Dropdown extends Component {
  constructor() {
    super();
    this.state = {open:false};
  }

  getItems() {
    let items = [];
    let counter = 0;
    this.props.items.forEach((item) => {
      items.push(<Picker.Item
        label={item.label}
        value={item.value === undefined ? item.label : item.value}
        key={counter + "_dropdown_" + this.props.label}
      />);
      counter += 1;
    })
    return items;
  }


  render() {
    return (
      <View>
        <TouchableHighlight onPress={() => {this.setState({open:!this.state.open})}}>
          <View style={[styles.listView, {height:this.props.barHeight}]}>
            <Text style={[styles.listText, this.props.labelStyle]}>{this.props.label}</Text>
            <Text style={[{flex:1, fontSize:17}, this.props.valueStyle]}>{this.props.value}</Text>
          </View>
        </TouchableHighlight>
        <SlideFadeInView height={this.props.dropdownHeight || 216} visible={this.state.open === true} >
          <View style={{position:'relative', top: this.props.dropdownHeight === undefined ? 0 : -0.5*(216-this.props.dropdownHeight), backgroundColor:'#fff'}}>
            <Picker
              selectedValue={this.props.value}
              onValueChange={(value) => {
               this.setState({open:false});
               this.props.callback(value);
              }}
            >
              {this.getItems()}
            </Picker>
            </View>
        </SlideFadeInView>
      </View>
    );
  }
}
