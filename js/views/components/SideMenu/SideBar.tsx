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
import { eventBus } from '../../../util/eventBus'
import { Actions } from 'react-native-router-flux';
import { styles, colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import { Icon } from '../Icon'
import { CLOUD } from '../../../cloud/cloudAPI'
import { FinalizeLocalizationIcon } from '../FinalizeLocalizationIcon'
import { NativeBus, BluenetPromises } from '../../../native/Proxy'
import { logOut, quitApp, Util } from '../../../util/Util'
import { userHasPlugsInSphere, getPresentSphere } from '../../../util/DataUtil'

let FACTOR = 0.75; // also the sidemenu.js needs to be changed for this.
let BLUE_PADDING = 4;

export class SideBar extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();
    this.unsubscribe = [];
  }

  componentDidMount() {
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
          element: <FinalizeLocalizationIcon color={colors.menuBackground.rgba(0.75)} />,
          action: () => {
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
    menuItems.push({
      id: 'overview',
      label: 'Overview',
      element: <Icon name={"ios-color-filter-outline"} size={25}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        (Actions as any).sphereOverview({type:'reset'});
        setTimeout(() => {this.props.closeCallback();},0)
      }
    });
    return menuItems;
  }

  _getSettingsItems() {
    let state = this.props.store.getState();

    let settingItems = [];
    settingItems.push({
      id: 'profile',
      label: 'My Profile',
      element: <Icon name={"ios-body"} size={22}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        (Actions as any).settingsProfile();
        setTimeout(() => {this.props.closeCallback();},0)
      }
    });

    if (Object.keys(state.spheres).length > 0) {
      settingItems.push({
        id: 'spheres',
        label: 'Manage Spheres',
        element: <Icon name={"c1-house"} size={22} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor: 'transparent', padding: 0, margin: 0}}/>,
        action: () => {
          (Actions as any).settingsSphereOverview();
          setTimeout(() => { this.props.closeCallback(); }, 0)
        }
      });
    }
    else {
      settingItems.push({
        id: 'addSphere',
        label: 'Add Sphere',
        element: <Icon name={"c1-house"} size={22} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor: 'transparent', padding: 0, margin: 0}}/>,
        action: () => {
          eventBus.emit('showLoading', 'Creating Sphere...');
          setTimeout(() => { this.props.closeCallback(); }, 0);

          BluenetPromises.requestLocation()
            .then((location) => {
              let latitude = undefined;
              let longitude = undefined;
              if (location && location.latitude && location.longitude) {
                latitude = location.latitude;
                longitude = location.longitude;
              }
              return CLOUD.createNewSphere(this.props.store, state.user.firstName, eventBus, latitude, longitude)
            })
            .then((sphereId) => {
              eventBus.emit('hideLoading');
              let state = this.props.store.getState();
              let title = state.spheres[sphereId].config.name;
              (Actions as any).settingsSphere({sphereId: sphereId, title: title})
            })
            .catch(() => {eventBus.emit('hideLoading');});
        }
      });
    }



    let presentSphere = getPresentSphere(state);

    if (presentSphere && userHasPlugsInSphere(state, presentSphere)) {
      let tapToToggleSettings = { tutorial: false };
      if (Util.data.getTapToToggleCalibration(state)) {
        tapToToggleSettings.tutorial = true;
      }

      settingItems.push({
        id: 'calibrate',
        label: 'Calibrate Tap-to-Toggle',
        element: <Icon name={"md-flask"} size={22} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor: 'transparent', padding: 0, margin: 0}}/>,
        action: () => {
          eventBus.emit("CalibrateTapToToggle", tapToToggleSettings);
          setTimeout(() => { this.props.closeCallback(); }, 0)
        }
      });
    }
    settingItems.push({
      id: 'help',
      label: 'Help',
      element: <Icon name={"md-help-circle"} size={22}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
        setTimeout(() => {this.props.closeCallback();},0)
      }
    });
    settingItems.push({
      id: 'recover',
      label: 'Recover a Crownstone',
      element: <Icon name={"c1-socket2"} size={22}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        (Actions as any).settingsPluginRecoverStep1();
        setTimeout(() => {this.props.closeCallback();},0)
      }
    });
    settingItems.push({
      id: 'logout',
      label: 'Log Out',
      element: <Icon name={"md-log-out"} size={22}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        Alert.alert('Log out','Are you sure?',[
          {text: 'Cancel', style: 'cancel'},
          {text: 'OK', onPress: () => {
            logOut();
            setTimeout(() => {this.props.closeCallback();},0)
          }}
        ])
      }
    });
    settingItems.push({
      id: 'quit',
      label: 'Force Quit',
      element: <Icon name={"md-remove-circle"} size={22}  color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />,
      action: () => {
        Alert.alert('Are you sure?','Crownstones will not respond to you if you force quit the app. It will not run in the background anymore either.',[
          {text: 'Cancel', style: 'cancel'},
          {text: 'OK', onPress: () => {
            quitApp();
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
    if (menuItems.length > 1) {
      content.push(<MenuSegmentSeparator key="categoriesLabel" label="Categories"/>);
      this._fillItemList(content, menuItems);
    }

    let settingsItems = this._getSettingsItems();
    if (settingsItems.length > 0) {
      content.push(<MenuSegmentSeparator key="settingsLabel" label="Settings"/>);
      this._fillItemList(content, settingsItems);
    }
    content.push(<MenuSegmentSeparator key="spacer1" />);
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
        width: screenWidth*FACTOR - BLUE_PADDING,
        borderBottomWidth:1,
        borderColor: colors.darkGray.rgba(0.1),
        backgroundColor: colors.lightGray.rgba(0.5),
        alignItems:'center'
      }} onPress={() => {
        this.props.action()
      }}>
        <View style={[styles.centered,{width:25, marginRight:10}]}>
        {this.props.element}
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
        {this.props.label ? <Text style={{fontSize:16, fontWeight: '200', color: colors.darkGray.rgba(0.35)}}>{this.props.label}</Text> : undefined}
      </View>
    );
  }
}