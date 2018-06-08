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
import {Icon} from "./Icon";

let borderColor = 'rgba(0,0,0,0.1)';
let ROW_HEIGHT = 70;
let ICON_SIZE = 35;
let AMOUNT_OF_ITEMS_IN_ROW = 4;


export class IconSelection extends Component<any, any> {
  icons: any = {};
  duplicates: any = {};

  constructor(props) {
    super(props);

    let stateContent:any = {};
    props.categories.forEach((category) => {
      stateContent[category.key] = false;
    });

    if (stateContent.__new !== undefined) {
      stateContent.__new = true;
    }

    if (props.debug) {
      AMOUNT_OF_ITEMS_IN_ROW = 3
      ROW_HEIGHT = 150
      ICON_SIZE = 50
      let iconKeys = Object.keys(props.icons);
      let newOnes = {};
      iconKeys.forEach((key) => {
        props.icons[key].forEach((icon) => {
          if (this.icons[icon]) {
            this.duplicates[icon] = true;
            newOnes[icon] = false;
          }
          else {
            newOnes[icon] = true;
          }
          this.icons[icon] = true;
        })
      });

      let newIcons = Object.keys(newOnes);
      let newIconArray = [];
      newIcons.forEach((newIcon) => {
        if (newOnes[newIcon] === true) {
          newIconArray.push(newIcon)
        }
      });
      stateContent["offset"] = {}
      // console.log(JSON.stringify(newIconArray, undefined, 2));
      console.log("Amount of duplicate icons: ", Object.keys(this.duplicates).length, ':', JSON.stringify(Object.keys(this.duplicates), undefined, 2))
    }

    this.state = stateContent;
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
    let heightWhenVisible =  Math.ceil(icons.length / AMOUNT_OF_ITEMS_IN_ROW) * (ROW_HEIGHT + 1);

    return (
      <View key={category.key}>
        <NavigationBar label={category.label} arrowDown={this.state[category.key]} callback={() => {
          let newState = {};
          newState[category.key] = !this.state[category.key];
          this.setState(newState)
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category.key]} height={heightWhenVisible} duration={300}>
          {this._getIconRows(icons, this.state[category.key])}
        </SlideInView>
      </View>
    )
  }

  _getIconRows(icons, visible) {
    if (visible === true) {
      let rowCount = Math.ceil(icons.length / AMOUNT_OF_ITEMS_IN_ROW);
      let items = [];
      for (let i = 0; i < rowCount; i++) {
        items.push(this._getIconRow(icons, i * AMOUNT_OF_ITEMS_IN_ROW, 'iconRow_' + i))
      }
      return items;
    }
    return undefined;
  }

  _getIconRow(icons, iconIndex, key) {
    let items = [];
    for (let i = 0; i < AMOUNT_OF_ITEMS_IN_ROW; i++) {
      items.push(this._getIcon(   icons, iconIndex + i));
      if (i < AMOUNT_OF_ITEMS_IN_ROW - 1) {
        items.push(this._getBorder(icons, iconIndex + i))
      }
    }

    return (
      <View key={key}>
        <View style={{flexDirection:'row'}}>
          { items }
        </View>
        <View style={{height:1, backgroundColor: borderColor}} />
      </View>
    )
  }

  _getBorder(icons, iconIndex) {
    if (iconIndex < icons.length) {
      return (
        <View key={icons[iconIndex]+ "_border"} style={{width:1, backgroundColor: borderColor}} />
      )
    }
  }

  _getIcon(icons, iconIndex) {
    if (iconIndex < icons.length) {
      let backgroundColor = this.props.selectedIcon === icons[iconIndex] ? colors.blue.hex : "transparent";
      if (this.props.debug === true && this.duplicates[icons[iconIndex]]) {
        backgroundColor = colors.red.hex;
      }

      if (this.props.debug) {
        let offset = Number(this.state.offset[icons[iconIndex]]) || 0;
        let h = ICON_SIZE + 20;
        return (
          <View style={[styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ]} key={icons[iconIndex]}>
            <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h}, {backgroundColor: colors.blue.rgba(1)} ]} />
            <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h, borderRadius: 0.5*h}, {backgroundColor: colors.red.rgba(1)} ]} />
            <View style={[styles.centered, {position:'absolute', top: 15, left: 15, width: ICON_SIZE, height:ICON_SIZE}, {backgroundColor: colors.purple.rgba(0.6)} ]} />
            <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h} ]}>
              <View style={{position:'relative', top: offset*ICON_SIZE, left: 0}}>
                <Icon name={icons[iconIndex]} size={ICON_SIZE} color={ this.props.selectedIcon === icons[iconIndex] ? colors.white.hex : colors.white.hex} />
              </View>
            </View>
            <View style={[styles.centered, {position:'absolute', top:5, left: 5 + 0.5*h - 1, width: 2, height:h},  {backgroundColor: colors.black.rgba(0.5)} ]} />
            <View style={[styles.centered, {position:'absolute', top:5 + 0.5*h - 1, left: 5, width: h, height: 2}, {backgroundColor: colors.black.rgba(0.5)} ]} />
            <TouchableOpacity style={{position:'absolute', top:5, left: 5, width:h, height: 0.5*h}} onPress={() => {
              let offsetObj = this.state.offset;
              offsetObj[icons[iconIndex]] = String(offset - 0.01);
              this.setState({offset: offsetObj})}} />
            <TouchableOpacity style={{position:'absolute', top: 0.5*h + 5, left: 5, width:h, height: 0.5*h}} onPress={() => {
              let offsetObj = this.state.offset;
              offsetObj[icons[iconIndex]] = String(offset + 0.01);
              this.setState({offset: offsetObj})}} />
            
            <Text style={{position:'absolute', top: ICON_SIZE + 40, fontSize:14, color: this.props.selectedIcon === icons[iconIndex] ? colors.white.hex : colors.white.hex}}>{icons[iconIndex] + " o:" + offset}</Text>
          </View>
        )
      }
      else {
        return (
          <TouchableOpacity
            key={icons[iconIndex]}
            style={[styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ]}
            onPress={() => {this.props.callback(icons[iconIndex])}}
          >
            <CustomIcon name={icons[iconIndex]} size={ICON_SIZE} color={ this.props.selectedIcon === icons[iconIndex] ? colors.white.hex : colors.white.hex} />
             </TouchableOpacity>
        )
      }

    }
    else {
      return (
        <View key={"Empty" + iconIndex} style={{flex:1}} />
      )
    }
  }

  render() {
    return (
      <View style={{flexDirection:'column', backgroundColor:"rgba(255,255,255,0.5)"}}>
        <View style={{height:1, backgroundColor: borderColor}} />
        {this._getIcons()}
      </View>
    );
  }
}
