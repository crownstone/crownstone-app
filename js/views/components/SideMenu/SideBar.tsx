import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  AppRegistry,
  Navigator,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import { eventBus } from '../../../util/EventBus'
import { Actions } from 'react-native-router-flux';
import { styles, colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import { Icon } from '../Icon'
import { FinalizeLocalizationIcon } from '../FinalizeLocalizationIcon'
import { NativeBus } from '../../../native/libInterface/NativeBus'
import { AppUtil } from '../../../util/AppUtil'
import { SettingConstructor } from '../../../util/SettingConstructor'

const DeviceInfo = require('react-native-device-info');

let FACTOR = 0.75; // also the sidemenu.js needs to be changed for this.
let BLUE_PADDING = 4;

export class SideBar extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeSpheres || change.changeStones || change.changeAppSettings) {
        this.forceUpdate();
      }
    }));
    // trigger a redraw then the sphere is entered/left
    this.unsubscribe.push(NativeBus.on(NativeBus.topics.enterSphere, () => { this.forceUpdate() }));
    this.unsubscribe.push(NativeBus.on(NativeBus.topics.exitSphere,  () => { this.forceUpdate() }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsubscribe) => {
      unsubscribe();
    })
  }

  _getActions() {
    let actionItems = [];
    if (this.props.viewProps && this.props.viewProps.actions) {
      if (this.props.viewProps.actions.finalizeLocalization !== undefined) {
        actionItems.push({
          id: 'finalizeLocalization',
          label: 'Setup localization',
          icon: <FinalizeLocalizationIcon color={colors.menuBackground.rgba(0.75)} />,
          callback: () => {
            this.props.viewProps.actions.finalizeLocalization();
            setTimeout(() => {this.props.closeCallback();},0)
          }
        });
      }
    }
    return actionItems;
  }

  _getMenuItems() {
    let menuItems = [];
    // menuItems.push({
    //   id: 'overview',
    //   label: 'Overview',
    //   icon: <Icon name={"ios-color-filter-outline"} size={25} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
    //   callback: () => {
    //     Actions.sphereOverview({type:'reset'});
    //     setTimeout(() => {this.props.closeCallback();},0)
    //   }
    // });
    menuItems.push({
      id: 'messages',
      label: 'Messages',
      icon: <Icon name={"ios-mail"} size={25} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      callback: () => {
        Actions.messageInbox();
        setTimeout(() => {this.props.closeCallback();},0)
      }
    });
    return menuItems;
  }

  _getSettingsItems() {
    let state = this.props.store.getState();

    let settingItems = SettingConstructor(this.props.store, state, eventBus);

    settingItems.push({
      id: 'quit',
      label: 'Force Quit',
      icon: <Icon name={"md-remove-circle"} size={22} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      callback: () => {
        Alert.alert('Are you sure?','Crownstones will not respond to you if you force quit the app. It will not run in the background anymore either.',[
          {text: 'Cancel', style: 'cancel'},
          {text: 'OK', onPress: () => {
            AppUtil.quit();
          }}
        ])
      }
    });

    return settingItems;
  }

  _fillItemList(content, items) {
    for (let i = 0; i < items.length; i++) {
      content.push(<MenuItem key={items[i].id} {...items[i]} closeCallback={this.props.closeCallback} />);
    }
  }

  _getContent() {
    let content = [];
    let actions = this._getActions();
    if (actions.length > 0) {
      content.push(<MenuSegmentSeparator key="actionLabel" label="Actions"/>);
      this._fillItemList(content, actions);
    }
    let menuItems = this._getMenuItems();
    // only show menu items when there's actually something to choose.
    if (menuItems.length > 0) {
      content.push(<MenuSegmentSeparator key="categoriesLabel" label="Categories"/>);
      this._fillItemList(content, menuItems);
    }

    let settingsItems = this._getSettingsItems();
    if (settingsItems.length > 0) {
      content.push(<MenuSegmentSeparator key="settingsLabel" label="Settings"/>);
      this._fillItemList(content, settingsItems);
    }
    content.push(<MenuSegmentSeparator key="version" label={"Version: " + DeviceInfo.getReadableVersion()} smallText={true}/>);
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
        <Image source={require('../../../images/menuBackground.png')} style={{width: screenWidth * FACTOR - BLUE_PADDING, height: screenHeight - topBarHeight}} >
          <MenuCategoryImage />
          <ScrollView>
            {this._getContent()}
          </ScrollView>
        </Image>
      </View>
    );
  }
}


class MenuTopBar extends Component<any, any> {
  render(){
    return (
      <View style={{width: screenWidth*FACTOR - BLUE_PADDING, height: topBarHeight}}>
        <View style={{width: screenWidth*FACTOR - BLUE_PADDING, height: topBarHeight, backgroundColor: colors.menuBackground.hex, justifyContent:'center'}}>
          {/*<Icon name="c2-crownstone" color="#fff" size={60} style={{marginTop:3, marginLeft: 3}} />*/}
          <Text style={{paddingLeft: 10, fontSize:20, fontWeight:'500', color: colors.white.hex}}>Crownstone</Text>
        </View>
      </View>
    );
  }
}

class MenuItem extends Component<any, any> {
  render(){
    return (
      <TouchableOpacity style={{
        flexDirection:'row',
        padding:10,
        paddingLeft: 25,
        height: 50,
        width: screenWidth*FACTOR - BLUE_PADDING,
        borderBottomWidth:1,
        borderColor: colors.darkGray.rgba(0.1),
        backgroundColor: colors.lightGray.rgba(0.5),
        alignItems:'center'
      }} onPress={() => {
        this.props.callback();
        setTimeout(() => { this.props.closeCallback(); }, 0)
      }}>
        <View style={[styles.centered,{width:25, marginRight:10}]}>
        {this.props.icon}
        </View>
        <Text style={{paddingLeft: 15, fontSize:16, fontWeight: '300', color: colors.darkGray.rgba(0.5)}}>{this.props.label}</Text>
      </TouchableOpacity>
    );
  }
}

class MenuCategoryImage extends Component<any, any> {
  render(){
    return (
      <Image source={require('../../../images/sideMenu.png')} style={{width: screenWidth * FACTOR - BLUE_PADDING, height: 120}}>
      </Image>
    );
  }
}


class MenuSegmentSeparator extends Component<any, any> {
  render(){
    return (
      <View style={{
        padding:10,
        width: screenWidth*FACTOR - BLUE_PADDING,
        alignItems:'flex-start',
        justifyContent:'center',
        height: 45,
        borderWidth: this.props.label ? 1 : 0 ,
        borderColor: colors.darkGray.rgba(0.2),
        backgroundColor: this.props.label ? colors.white.rgba(0.5) : 'transparent',
      }}>
        {this.props.label ? <Text style={{fontSize:this.props.smallText?14:16, fontWeight: '200', color: colors.darkGray.rgba(0.35)}}>{this.props.label}</Text> : undefined}
      </View>
    );
  }
}
