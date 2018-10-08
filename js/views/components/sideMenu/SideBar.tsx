import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
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
import { eventBus }                 from '../../../util/EventBus'
import { Actions }                  from 'react-native-router-flux';
import { styles, colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import { Icon }                     from '../Icon'
import { FinalizeLocalizationIcon } from '../FinalizeLocalizationIcon'
import { NativeBus }                from '../../../native/libInterface/NativeBus'
import { AppUtil }                  from '../../../util/AppUtil'
import { SettingConstructor }       from '../../../util/SettingConstructor'
import {LOG, LOGe} from "../../../logging/Log";
import { StoreManager }             from "../../../router/store/storeManager";
import { SphereUtil }               from "../../../util/SphereUtil";

const DeviceInfo = require('react-native-device-info');

let FACTOR = 0.75; // also the sidemenu.js needs to be changed for this.
let BLUE_PADDING = 4;

export class SideBar extends Component<any, any> {
  unsubscribe : any = [];
  store = null;
  
  constructor(props) {
    super(props);
    
    this.store = StoreManager.getStore()
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (
        change.changeUserData            ||
        change.changeSpheres             ||
        change.changeFingerprint         ||
        change.changeStones              ||
        change.changeMessageState        ||
        change.changeDeveloperData       ||
        change.changeUserDeveloperStatus ||
        change.changeAppSettings
      ) {
        this.forceUpdate();
      }
    }));
    // trigger a redraw then the sphere is entered/left
    this.unsubscribe.push(NativeBus.on(NativeBus.topics.enterSphere, () => { this.forceUpdate(); }));
    this.unsubscribe.push(NativeBus.on(NativeBus.topics.exitSphere,  () => { this.forceUpdate(); }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsubscribe) => {
      unsubscribe();
    })
  }

  _getActions() {
    let actionItems = [];

    let state = this.store.getState();
    let finalizeLocalization = SphereUtil.finalizeLocalizationData(state)

    if (finalizeLocalization.showItem) {
      actionItems.push({
        id: 'finalizeLocalization',
        label: Languages.label("SideBar", "Setup_localization")(),
        icon: <FinalizeLocalizationIcon color={colors.menuBackground.rgba(0.75)} />,
        callback: () => {
          Actions.drawerClose()
          finalizeLocalization.action()
        }
      });
    }
    return actionItems;
  }

  _getMenuItems() {
    let menuItems = [];

    let state = this.store.getState();
    let highlight = SphereUtil.newMailAvailable(state)

    menuItems.push({
      id: 'messages',
      label: Languages.label("SideBar", "__New_Message__Messages")(highlight),
      icon: <Icon
        name={"ios-mail"}
        size={ highlight ? 32 : 25}
        color={highlight ? colors.csOrange.hex : colors.menuBackground.rgba(0.75)}
        style={{backgroundColor:'transparent', padding:0, margin:0}}
      />,
      highlight: highlight,
      callback: () => {
        Actions.drawerClose();
        Actions.messageInbox();
      }
    });
    return menuItems;
  }

  _getSettingsItems() {
    let state = this.store.getState();
    let settingItems = SettingConstructor(this.store, state, eventBus, () => { Actions.drawerClose() });

    settingItems.push({
      id: 'quit',
      label: Languages.label("SideBar", "Force_Quit")(),
      icon: <Icon name={"md-remove-circle"} size={22} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      callback: () => {
        Alert.alert(
Languages.alert("SideBar", "_Are_you_sure___Crownston_header")(),
Languages.alert("SideBar", "_Are_you_sure___Crownston_body")(),
[{text: Languages.alert("SideBar", "_Are_you_sure___Crownston_left")(), style: 'cancel'},
          {
text: Languages.alert("SideBar", "_Are_you_sure___Crownston_right")(), onPress: () => {
            try {
              AppUtil.quit();
            }
            catch(err) {
              LOGe.info("Failed to quit.", err);
            }
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
        <Image source={require('../../../images/menuBackground.png')} style={{position:'absolute', top:0, left:0, width: screenWidth * FACTOR - BLUE_PADDING, height: screenHeight}} />
        <View style={{position:'absolute', top:0, left:0, width: screenWidth * FACTOR - BLUE_PADDING, height: screenHeight}}>
          <MenuTopBar />
          <MenuCategoryImage />
          <ScrollView>
            {this._getContent()}
          </ScrollView>
        </View>
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
          <Text style={{paddingLeft: 10, fontSize:20, fontWeight:'500', color: colors.white.hex}}>{ Languages.text("SideBar", "Crownstone")() }</Text>
        </View>
      </View>
    );
  }
}

class MenuItem extends Component<any, any> {
  render(){
    let backgroundColor = colors.lightGray.rgba(0.5);
    let foregroundColor = colors.darkGray.rgba(0.5);
    let weight = '300';
    let fontStyle = 'normal';

    if (this.props.highlight) {
      weight    = 'bold';
      fontStyle = 'italic';
    //   backgroundColor = colors.csOrange.rgba(0.5);
    //   foregroundColor = colors.white.hex;
    }
    return (
      <TouchableOpacity style={{
        flexDirection:'row',
        padding:10,
        paddingLeft: 25,
        height: 50,
        width: screenWidth*FACTOR - BLUE_PADDING,
        borderBottomWidth:1,
        borderColor: colors.darkGray.rgba(0.1),
        backgroundColor: backgroundColor,
        alignItems:'center',
      }} onPress={() => {
        this.props.callback();
      }}>
        <View style={[styles.centered,{width:25, marginRight:10}]}>
          {this.props.icon}
        </View>
        <Text style={{paddingLeft: 15, fontSize:16, fontWeight: weight, fontStyle: fontStyle, color: foregroundColor}}>{this.props.label}</Text>
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
