import React, { Component } from 'react'
import {
  Picker,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { SlideFadeInView }  from './../animated/SlideFadeInView'
import { styles, colors, width } from '../../styles'


export class Dropdown extends Component {
  constructor(props) {
    super();
    this.state = {open:false, value: props.value};
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
          width:width,
          flexDirection:'row',
          height:50,
          backgroundColor:'#fff',
          justifyContent:'center',
          borderColor:colors.lightGray.hex,
          borderBottomWidth:1
        }}>
          <TouchableOpacity style={{flex:1, justifyContent:'center', alignItems:'flex-start', paddingLeft:10}} onPress={() => {
            this.setState({value: this.props.value, open: false});
          }}>
            <Text style={{fontSize:16, color:colors.gray.hex}}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{flex:1, justifyContent:'center', alignItems:'flex-end', paddingRight:10}} onPress={() => {
            this.setState({open: false});
            this.props.callback(this.state.value);
          }}>
            <Text style={{fontSize:16, color:colors.blue.hex}}>Done</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  render() {
    let dropHeight = this.props.dropdownHeight || 216;
    let totalHeight = dropHeight;
    if (this.props.buttons === true) {
      totalHeight += 50;
    }

    return (
      <View>
        <TouchableHighlight onPress={() => {this.setState({open:!this.state.open})}}>
          <View style={[styles.listView, {height:this.props.barHeight}]}>
            <Text style={[styles.listText, this.props.labelStyle]}>{this.props.label}</Text>
            <Text style={[{flex:1, fontSize:16}, this.props.valueStyle]}>{this.props.buttons !== true ? this.props.value : this.state.value}</Text>
          </View>
        </TouchableHighlight>
        <SlideFadeInView height={totalHeight} visible={this.state.open === true}  style={{backgroundColor:'#fff'}}>
          <View style={{position:'relative', top: (totalHeight-dropHeight) -0.5*(216-dropHeight), height:dropHeight}}>
            <Picker
              selectedValue={this.state.value}
              onValueChange={(value) => {
                  if (this.props.buttons !== true) {
                    this.setState({open: false});
                    this.props.callback(value);
                  }
                  else {
                    this.setState({value: value})
                  }
                }
              }
            >
              {this.getItems()}
            </Picker>
          </View>
          {this._getButtonBar()}
        </SlideFadeInView>
      </View>
    );
  }
}
