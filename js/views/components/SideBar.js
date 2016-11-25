import React, { Component } from 'react'
import {
  Alert,
  AppRegistry,
  Navigator,
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import { Scene, Router, Actions, DefaultRenderer } from 'react-native-router-flux';
import { styles, colors, screenWidth, screenHeight, topBarHeight} from '../styles'
import { Icon } from './Icon'

let MENU_ITEMS = [
  {
    id: 'overview',
    name: 'Overview',
    element: <Icon name={"ios-color-filter-outline"} size={25}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
    action: () => {Actions.overview({type:'reset'})}
  },
  {
    id: 'settings',
    name: 'Settings',
    element: <Icon name={"ios-cog"} size={25}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
    action: () => { console.log("here");Actions.settingsOverview({type:'reset'})}
  }

];

let FACTOR = 0.75;
let BLUEPADDING = 4;

export class SideBar extends Component {
  constructor() {
    super();
  }

  _fillItemList(content, items) {
    for (let i = 0; i < items.length; i++) {
      content.push(<MenuItem key={items[i].id} {...items[i]} />);
    }
  }

  _getContent() {
    let content = [];
    if (this.props.actions !== undefined) {
      content.push(<MenuSegmentSeparator key="actionLabel" label="Actions"/>);
      this._fillItemList(content, this.props.actions);
    }
    content.push(<MenuSegmentSeparator key="categoryLabel" label="Categories"/>);
    this._fillItemList(content, MENU_ITEMS);
    return content;
  }

  render(){
    let color = colors.blue.rgba(0.8);
    if (this.props.viewingRemotely) {
      color = colors.notConnected.rgba(0.75);
    }
    return (
      <View style={{flexDirection:'column', flex:1, height:screenHeight,  backgroundColor: color}}>
        <MenuTopBar />
        <Image source={require('../../images/menuBackground.png')} style={{width: screenWidth * FACTOR - BLUEPADDING, height: screenHeight}} >
          <MenuCategoryImage />
          {this._getContent()}
        </Image>
      </View>
    );
  }
}


class MenuTopBar extends Component {
  render(){
    return (
      <View style={{width: screenWidth*FACTOR - BLUEPADDING, height: topBarHeight}}>
        <View style={{width: screenWidth*FACTOR - BLUEPADDING, height: topBarHeight, backgroundColor: colors.menuBackground.hex, justifyContent:'center'}}>
          {/*<Icon name="c2-crownstone" color="#fff" size={60} style={{marginTop:3, marginLeft: 3}} />*/}
          <Text style={{paddingLeft: 10, fontSize:20, fontWeight:'500', color: colors.white.hex}}>Crownstone</Text>
        </View>
      </View>
    );
  }
}

class MenuItem extends Component {
  render(){
    return (
      <TouchableOpacity style={{
        flexDirection:'row',
        padding:10,
        paddingLeft: 20,
        width: screenWidth*FACTOR - BLUEPADDING,
        borderBottomWidth:1,
        borderColor: colors.darkGray.rgba(0.1),
        backgroundColor: colors.lightGray.rgba(0.5),
        alignItems:'center'
      }} onPress={() => {this.props.action()}}>
        {this.props.element}
        <Text style={{paddingLeft: 15, fontSize:16, fontWeight: '300', color: colors.darkGray.rgba(0.5)}}>{this.props.label}</Text>
      </TouchableOpacity>
    );
  }
}

class MenuCategoryImage extends Component {
  render(){
    return (
      <Image source={require('../../images/sideMenu.png')} style={{width: screenWidth * FACTOR - BLUEPADDING, height: 120}}>
      </Image>
    );
  }
}


class MenuSegmentSeparator extends Component {
  render(){
    return (
      <View style={{
        padding:10,
        width: screenWidth*FACTOR - BLUEPADDING,
        borderWidth:1,
        borderColor: colors.darkGray.rgba(0.2),
        backgroundColor: colors.white.rgba(0.5),
      }}>
        <Text style={{fontSize:16, fontWeight: '500', color: colors.darkGray.rgba(0.35)}}>{this.props.label}</Text>
      </View>
    );
  }
}