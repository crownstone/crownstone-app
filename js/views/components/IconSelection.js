import React, { Component } from 'react'
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';

import { styles, colors, width } from '../styles'

import { CustomIcon } from '../../fonts/customIcons'

let borderColor = 'rgba(0,0,0,0.1)';

export class IconSelection extends Component {
  constructor() {
    super();
  }

  _getIcons() {
    let items = [];
    this.props.categories.forEach((category) => {
      items.push(this._getCategory(category))
    });

    return items;
  }

  _getCategory(category) {
    let icons = this.props.icons[category.key];

    return (
      <View key={category.key}>
        <View style={{backgroundColor:'#fff', padding:5, paddingTop:15}}>
          <Text style={{fontWeight:'100', fontSize:15}}>{category.label}</Text>
        </View>
        <View style={{height:1, flex:1, backgroundColor: borderColor}} />
        {this._getIconRows(icons)}
      </View>
    )
  }

  _getIconRows(icons) {
    let rowCount = Math.ceil(icons.length/3);
    let items = [];
    for (let i = 0; i < rowCount; i++) {
      items.push(this._getIconRow(icons,i*3, 'iconRow_'+i))
    }
    return items;
  }

  _getIconRow(icons, iconIndex, key) {
    return (
      <View key={key}>
        <View style={{flexDirection:'row'}}>
          {this._getIcon(   icons, iconIndex)}
          {this._getBorder( icons, iconIndex)}
          {this._getIcon(   icons, iconIndex+1)}
          {this._getBorder( icons, iconIndex+1)}
          {this._getIcon(   icons, iconIndex+2)}
        </View>
        <View style={{height:1, flex:1, backgroundColor: borderColor}} />
      </View>
    )
  }

  _getBorder(icons, iconIndex) {
    if (iconIndex < icons.length) {
      return <View style={{width:1, backgroundColor: borderColor}} />
    }
  }
  _getIcon(icons, iconIndex) {
    if (iconIndex < icons.length) {
      return <TouchableOpacity
        style={[styles.centered, {height:90, flex:1}, this.props.selectedIcon === icons[iconIndex] ? {backgroundColor:colors.blue.hex} : undefined]}
        onPress={() => {this.props.callback(icons[iconIndex])}}
      >
        <CustomIcon name={icons[iconIndex]} size={60} color={ this.props.selectedIcon === icons[iconIndex] ? '#fff' : colors.blue.hex} />
      </TouchableOpacity>
    }
    else {
      return <View style={{flex:1}} />
    }
  }

  render() {
    return (
      <View style={{flexDirection:'column', backgroundColor:"rgba(255,255,255,0.5)"}}>
        <View style={{height:1, flex:1, backgroundColor: borderColor}} />
        {this._getIcons()}
      </View>
    );
  }
}
