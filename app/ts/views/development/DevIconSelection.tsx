
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DevIconSelection", key)(a,b,c,d,e);
}
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

  allocationMap = {};

  constructor(props) {
    super(props);

    let sel = Object.keys(props.icons)[0];
    let stateContent:any = {};
    Object.keys(props.icons).forEach((category) => {
      stateContent[category] = false;

      this.allocationMap[category] = [];
      props.icons[category].forEach((icon) => {
        this.allocationMap[category].push(icon);
      })
    });

    this.state = {...stateContent, activeCategory: sel};



  }

  _getIcons() {
    let items = [];
    Object.keys(this.props.icons).forEach((category) => {
      items.push(this._getCategory(category))
    });

    return items;
  }

  _getCategory(category) {
    let limit = 2000;
    if  (category === 'limited')  { limit = 20; }

    let icons = this.allocationMap[category]
    let heightWhenVisible =  Math.ceil(Math.min(icons.length,limit) / AMOUNT_OF_ITEMS_IN_ROW) * (ROW_HEIGHT + 1);

    return (
      <View key={category}>
        <NavigationBar label={category + "  (" + icons.length + ")"} arrowDown={this.state[category]} callback={() => {
          let newState = {};
          newState[category] = !this.state[category];
          this.setState(newState);
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category]} height={heightWhenVisible} duration={300}>
          {this._getIconRows(icons, this.state[category], limit, category)}
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
        counter++;
        rowCount = rowCount + 1;
        rowItems.push(this._getIcon( icons, i, category));
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

  _getIcon(icons, iconIndex, inCategory) {
    if (iconIndex < icons.length) {
      let backgroundColor = this.props.selectedIcon === icons[iconIndex] ? colors.blue3.hex : this.props.iconBackgroundColor || "transparent";
      if (this.props.debug === true && this.duplicates[icons[iconIndex]]) {
        backgroundColor = colors.red.hex;
      }

      return (
        <View
          key={   icons[iconIndex] }
          style={ [styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ] }
        >
          <TouchableOpacity onPress={() => {
            let icon = icons[iconIndex];
            let ind = this.allocationMap[inCategory].indexOf(icons[iconIndex])
            this.allocationMap[inCategory].splice(ind,1);
            this.allocationMap[this.state.activeCategory].push(icon)

            this.forceUpdate() }}>
            <Icon name={icons[iconIndex]} size={ICON_SIZE} color={this.props.iconColor || colors.white.hex} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            this.allocationMap[inCategory].splice(iconIndex,1);
            this.allocationMap['hidden'].push(icons[iconIndex])

            this.forceUpdate() }}><Text>{ lang("HIDE") }</Text></TouchableOpacity>
          {/*<Text style={{fontSize:8}}>{icons[iconIndex]}</Text>*/}
        </View>
      );
    }
    else {
      return (
        <View key={"Empty" + iconIndex} style={{flex:1}} />
      )
    }
  }


  _getCategoriesForSelection() {
    let categories = Object.keys(this.props.icons);

    let items = [];
    let rowItems = [];
    let rowIndex = 0;
    categories.forEach((cat) => {
      rowItems.push(
        <TouchableOpacity
          key={'selCat' + cat}
          style={{padding:4, margin:4, backgroundColor: this.state.activeCategory === cat ? colors.green.hex : colors.blue.hex}}
          onPress={() => { this.setState({activeCategory: cat}) }}>
          <Text>{cat}</Text>
        </TouchableOpacity>
      );
      if (rowItems.length === 3) {
        rowIndex++;
        items.push(<View key={"myRowIs" + rowIndex} style={{flexDirection:'row'}}>{rowItems}</View>);
        rowItems = [];
      }
    });

    if (rowItems.length > 0) {
      rowIndex++;
      items.push(<View key={"myRowIs" + rowIndex} style={{flexDirection:'row'}}>{rowItems}</View>);
    }

    return <View>{items}</View>
  }


  render() {
    return (
      <View style={{flexDirection:'column', backgroundColor:"rgba(255,255,255,0.5)"}}>
        {this._getCategoriesForSelection() }

        <View style={{height:1, backgroundColor: borderColor}} />
        {this._getIcons()}
        <TouchableOpacity style={{padding:10, margin:10}} onPress={() => {
          let categories = Object.keys(this.props.icons);
          categories.forEach((cat) => { console.log(cat, ":" ,this.allocationMap[cat]) });
        }}><Text>{ lang("PRINT") }</Text></TouchableOpacity>

        <TouchableOpacity style={{padding:10, margin:10}} onPress={() => {
          this.allocationMap['hidden'].forEach((icon) => {
            this.allocationMap['limited'].push(icon)
          })
          this.allocationMap['hidden'] = [];
          this.forceUpdate()
        }}><Text>{ lang("UNHIDE_ALL") }</Text></TouchableOpacity>
      </View>
    );
  }
}
