import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, Alert
} from 'react-native';

import {styles, colors, screenWidth} from '../styles'
import {NavigationBar} from "../components/editComponents/NavigationBar";
import {Separator} from "../components/Separator";
import {SlideInView} from "../components/animated/SlideInView";
import {Icon} from "../components/Icon";

let borderColor = 'rgba(0,0,0,0.1)';
let ROW_HEIGHT = 30;
let ICON_SIZE = 35;
let AMOUNT_OF_ITEMS_IN_ROW = 4;

export class DebugIconShowcase extends Component<any, any> {
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

    AMOUNT_OF_ITEMS_IN_ROW = 6;
    ROW_HEIGHT = 100;
    ICON_SIZE = screenWidth / (AMOUNT_OF_ITEMS_IN_ROW + 1);
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
    stateContent["offset"] = {};
    stateContent["circleSizeOffset"] = 20;

    this.props.categories.forEach((category) => {
      stateContent["offset"][category.key] = {};
      this.props.icons[category.key].forEach((iconName) => {
        stateContent["offset"][category.key][iconName] = {top: 0, left: 0}
      })
    });

    // console.log(JSON.stringify(newIconArray, undefined, 2));
    console.log("Amount of duplicate icons: ", Object.keys(this.duplicates).length, ':', JSON.stringify(Object.keys(this.duplicates), undefined, 2));

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
          if (!this.state[category.key] == false) {
            this._generateOffsets()
          }
          this.setState(newState);
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category.key]} height={heightWhenVisible} duration={300}>
          {this._getIconRows(icons, this.state[category.key], category.key)}
        </SlideInView>
      </View>
    )
  }

  _getIconRows(icons, visible, categoryKey) {
    if (visible === true) {
      let rowCount = Math.ceil(icons.length / AMOUNT_OF_ITEMS_IN_ROW);
      let items = [];
      for (let i = 0; i < rowCount; i++) {
        items.push(this._getIconRow(icons, i * AMOUNT_OF_ITEMS_IN_ROW, 'iconRow_' + i, categoryKey))
      }
      return items;
    }
    return undefined;
  }

  _getIconRow(icons, iconIndex, key, categoryKey) {
    let items = [];
    for (let i = 0; i < AMOUNT_OF_ITEMS_IN_ROW; i++) {
      items.push(this._getIcon(   icons, iconIndex + i, categoryKey));
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

  _getIcon(icons, iconIndex, categoryKey) {
    if (iconIndex < icons.length) {
      let backgroundColor = this.props.selectedIcon === icons[iconIndex] ? colors.blue3.hex : "transparent";

      if (this.duplicates[icons[iconIndex]]) {
        backgroundColor = colors.red.hex;
      }

      if (!this.props.offsets[categoryKey][icons[iconIndex]]) {
        console.log("No offset for ", categoryKey, icons[iconIndex])
      }

      return (
        <TouchableOpacity style={[styles.centered, {height: ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ]} key={icons[iconIndex]} onPress={() => { Alert.alert(icons[iconIndex])}}>
          <Icon name={icons[iconIndex]} size={ICON_SIZE} color={ colors.white.hex} />
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View key={"Empty" + iconIndex} style={{flex:1}} />
      );
    }
  }

  _generateOffsets() {
    let nameLength = 35;
    this.props.categories.forEach((category) => {
      let str = "const " + category.key + "Corrections = {\n";
      this.props.icons[category.key].forEach((iconName) => {
        let lineStr = "  '" + iconName + "':";
        for (let i =  lineStr.length; i < nameLength; i++) {
          lineStr += ' '
        }
        let topExistingOffset = this.props.offsets[category.key] && this.props.offsets[category.key][iconName] && this.props.offsets[category.key][iconName].top || 0;
        let topOffset = Number(this.state.offset[category.key][iconName].top);
        let topOffsetLabel = topExistingOffset + topOffset;
        
        let leftExistingOffset = this.props.offsets[category.key] && this.props.offsets[category.key][iconName] && this.props.offsets[category.key][iconName].left || 0;
        let leftOffset = Number(this.state.offset[category.key][iconName].left);
        let leftOffsetLabel = leftExistingOffset + leftOffset;
        
        lineStr += "{change: true, top: " + (topOffsetLabel < 0 ? '' : '+') + topOffsetLabel.toFixed(3) + ', left: ' + (leftOffsetLabel < 0 ? '' : '+') + leftOffsetLabel.toFixed(3) + '},\n';
        str += lineStr
      });
      str += '}\n\n';
      console.log(str)
    })
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
