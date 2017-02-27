import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';

import { styles, colors } from '../styles'

import { SlideInView } from './animated/SlideInView'
import { NavigationBar } from './editComponents/NavigationBar'
import { Separator } from './Separator'
import { CustomIcon } from '../../fonts/customIcons'

let borderColor = 'rgba(0,0,0,0.1)';
let rowHeight = 90;

export class IconSelection extends Component<any, any> {
  constructor(props) {
    super();

    this.state = {};
    props.categories.forEach((category) => {
      this.state[category.key] = false;
    })
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
    let heightWhenVisible =  Math.ceil(icons.length/3) * (rowHeight + 1);

    return (
      <View key={category.key}>
        <NavigationBar label={category.label} arrowDown={this.state[category.key]} callback={() => {
          let newState = {};
          newState[category.key] = !this.state[category.key];
          this.setState(newState)
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category.key]} height={heightWhenVisible} duration={500}>
          {this._getIconRows(icons, this.state[category.key])}
        </SlideInView>
      </View>
    )
  }

  _getIconRows(icons, visible) {
    if (visible === true) {
      let rowCount = Math.ceil(icons.length / 3);
      let items = [];
      for (let i = 0; i < rowCount; i++) {
        items.push(this._getIconRow(icons, i * 3, 'iconRow_' + i))
      }
      return items;
    }
    return undefined;
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
        style={[styles.centered, {height:rowHeight, flex:1}, this.props.selectedIcon === icons[iconIndex] ? {backgroundColor:colors.blue.hex} : undefined]}
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
