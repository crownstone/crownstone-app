import { Languages } from "../../Languages"
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

import {styles, colors, screenWidth} from '../styles'

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
      ROW_HEIGHT = 250
      ICON_SIZE = screenWidth / (AMOUNT_OF_ITEMS_IN_ROW + 1)
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
          this.setState(newState);
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

      return (
        <TouchableOpacity
          key={     icons[iconIndex] }
          style={   [styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ] }
          onPress={ () => {this.props.callback(icons[iconIndex])} }
        >
          <CustomIcon name={icons[iconIndex]} size={ICON_SIZE} color={ colors.white.hex} />
        </TouchableOpacity>
      );
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
