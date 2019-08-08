import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {styles, colors, screenWidth} from '../styles'
import {NavigationBar} from "../components/editComponents/NavigationBar";
import {Separator} from "../components/Separator";
import {SlideInView} from "../components/animated/SlideInView";
import { Icon } from "../components/Icon";

let borderColor = 'rgba(0,0,0,0.1)';
let ROW_HEIGHT = 100;
let ICON_SIZE = 40;
let AMOUNT_OF_ITEMS_IN_ROW = 4;

export class DevIconSelection extends Component<any, any> {
  icons: any = {};
  duplicates: any = {};

  hidden = {};
  selected = {};

  constructor(props) {
    super(props);

    let stateContent:any = {};
    props.categories.forEach((category) => {
      stateContent[category.key] = false;
    });

    if (stateContent.__new !== undefined) {
      stateContent.__new = true;
    }

    this.state = stateContent;

    this.hidden = {};

  }

  _getIcons() {
    let items = [];
    this.props.categories.forEach((category) => {
      items.push(this._getCategory(category))
    });

    return items;
  }

  _getCategory(category) {
    let icons = [];
    if      (category.key === '__new')    { icons = this.props.icons[category.key]; }
    else if (category.key === 'selected') { icons = Object.keys(this.selected);     }
    else if (category.key === 'hidden')   { icons = Object.keys(this.hidden);       }

    let limit = 20;
    if      (category.key === '__new')    { limit = 20;   }
    else if (category.key === 'selected') { limit = 2000; }
    else if (category.key === 'hidden')   { limit = 2000; }


    let heightWhenVisible =  Math.ceil(Math.min(icons.length,limit) / AMOUNT_OF_ITEMS_IN_ROW) * (ROW_HEIGHT + 1);

    return (
      <View key={category.key}>
        <NavigationBar label={category.label} arrowDown={this.state[category.key]} callback={() => {
          let newState = {};
          newState[category.key] = !this.state[category.key];
          this.setState(newState);
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category.key]} height={heightWhenVisible} duration={300}>
          {this._getIconRows(icons, this.state[category.key], limit, category.key)}
        </SlideInView>
      </View>
    )
  }

  _getIconRows(icons, visible, limit, category) {
    if (visible === true) {
      let counter = 0;
      let rowCount = 0;
      let items = [];
      let rowItems = [];
      for (let i = 0; i < icons.length && counter < limit; i++) {
        if (category !== '__new' || (this.hidden[icons[i]] !== true && this.selected[icons[i]] !== true)) {
          counter++;
          rowCount = rowCount + 1;
          rowItems.push(this._getIcon( icons, i));
          if (rowCount < AMOUNT_OF_ITEMS_IN_ROW) {
            rowItems.push(this._getBorder(icons,  i))
          }
          if (rowCount === AMOUNT_OF_ITEMS_IN_ROW) {
            items.push(
              <View key={category + i}>
                <View style={{flexDirection:'row'}}>
                  {rowItems}
                </View>
               <View style={{height:1, backgroundColor: borderColor}} />
             </View>
            );
            rowItems = [];
            rowCount = 0;
          }
        }
      }

      if (rowItems.length > 0) {
        items.push(
          <View key={category + 2000}>
            <View style={{flexDirection:'row'}}>
              {rowItems}
            </View>
            <View style={{height:1, backgroundColor: borderColor}} />
          </View>
        );
      }
      return items;
    }
    return undefined;
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
      let backgroundColor = this.props.selectedIcon === icons[iconIndex] ? colors.blue.hex : this.props.iconBackgroundColor || "transparent";
      if (this.props.debug === true && this.duplicates[icons[iconIndex]]) {
        backgroundColor = colors.red.hex;
      }

      return (
        <View
          key={   icons[iconIndex] }
          style={ [styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ] }
        >
          <TouchableOpacity onPress={() => { this.hidden[icons[iconIndex]] = true; this.forceUpdate() }}>
            <Icon name={icons[iconIndex]} size={ICON_SIZE} color={this.props.iconColor || colors.white.hex} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { this.selected[icons[iconIndex]] = true; this.forceUpdate() }}><Text>add</Text></TouchableOpacity>
          <Text style={{fontSize:8}}>{icons[iconIndex]}</Text>
        </View>
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
        <TouchableOpacity onPress={() => {
          let icons = [];
          let names = Object.keys(this.props.icons['__new'])
          names.forEach((name) => {
            if (this.hidden[name] !== true && this.selected[name] !== true) {
              icons.push(name)
            }
          })


          console.log('this.selected',this.selected,'this.hidden',this.hidden, 'remaining', icons); }}><Text>PRINT</Text></TouchableOpacity>
      </View>
    );
  }
}
