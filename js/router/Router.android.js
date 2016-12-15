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
import { StoreManager }           from './store/storeManager'
import { LocationHandler }        from '../native/LocationHandler'
import { AdvertisementHandler }   from '../native/AdvertisementHandler'
import { KeepAliveHandler }       from '../native/KeepAliveHandler'
import { SetupStateHandler }      from '../native/SetupStateHandler'
import { StoneStateHandler }      from '../native/StoneStateHandler'
import { Scheduler }              from '../logic/Scheduler'
import { eventBus }               from '../util/eventBus'
import { prepareStoreForUser }    from '../util/dataUtil'
import { logOut }                 from '../util/util'
import { LOG, LOGDebug }          from '../logging/Log'
import { INITIALIZER }            from '../initialize'
import { CLOUD }                  from '../cloud/cloudAPI'
import { reducerCreate }          from './store/reducers/navigation'
import { OptionPopup }            from '../views/components/OptionPopup'
import { Processing }             from '../views/components/Processing'
import { SideMenu }               from '../views/components/SideMenu'
import { LocalizationSetupStep1 } from '../views/components/LocalizationSetupStep1'
import { LocalizationSetupStep2 } from '../views/components/LocalizationSetupStep2'
import { BleStateOverlay }        from '../views/components/BleStateOverlay'
import { Background }             from '../views/components/Background'
import { Views }                  from './Views'
import { styles, colors, screenWidth, screenHeight } from '../views/styles'
import { Icon } from '../views/components/Icon';

let store = {};


export class AppRouter extends Component {
  constructor() {
    super();
    this.state = {initialized:false, loggedIn: false};
    this.unsubscribe = [];
    this.renderState = undefined;
    this.backgrounds = { setup:undefined,
      main: undefined,
      mainRemoteNotConnected: undefined,
      menu: undefined,
      mainDarkLogo: undefined,
      mainDark: undefined
    };
  }

  componentDidMount() {
    // check what we should do with this data.
    let interpretData = () => {
      store = StoreManager.getStore();
      INITIALIZER.start(store);
      if (store.hasOwnProperty('getState')) {
        dataLoginValidation()
      }
      else {
        this.setState({storeInitialized:true, loggedIn:false});
      }

      this.unsubscribe.forEach((callback) => {callback()});
      this.unsubscribe = [];
    };

    // if there is a user that is listed as logged in, verify his account.
    let dataLoginValidation = () => {
      let state = store.getState();

      // pass the store to the singletons
      LocationHandler.loadStore(store);
      AdvertisementHandler.loadStore(store);
      Scheduler.loadStore(store);
      StoneStateHandler.loadStore(store);
      SetupStateHandler.loadStore(store);
      KeepAliveHandler.loadStore(store);

      // clear the temporary data like presence, state and disability of stones so no old data will be shown
      prepareStoreForUser(store);

      // // if we have an accessToken, we proceed with logging in automatically
      if (state.user.accessToken !== null) {
        // in the background we check if we're authenticated, if not we log out.
        CLOUD.setAccess(state.user.accessToken);
        CLOUD.getUserData({background:true})
          .then((reply) => {
            LOG("Verified User.", reply);
            CLOUD.sync(store, true);
          })
          .catch((reply) => {
            LOG("COULD NOT VERIFY USER -- ERROR", reply);
            if (reply.status === 401) {
              logOut();
              Alert.alert("Please log in again.", undefined, [{text:'OK'}]);
            }
          });
      //
        this.setState({storeInitialized:true, loggedIn:true});
        eventBus.emit("appStarted");
      }
      else {
        this.setState({storeInitialized:true, loggedIn:false});
      }
    };

    // there can be a race condition where the event has already been fired before this module has initialized
    // This check is to ensure that it doesn't matter what comes first.
    if (StoreManager.isInitialized() === true) {
      interpretData();
    }
    else {
      this.unsubscribe.push(eventBus.on('storeInitialized', interpretData));
    }
  }

  /**
   * Preloading backgrounds
   */
  componentWillMount() {
    this.backgrounds.setup                   = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/setupBackground.png')} />;
    this.backgrounds.main                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLight.png')} />;
    this.backgrounds.mainRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightNotConnected.png')} />;
    this.backgrounds.mainRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightConnected.png')} />;
    this.backgrounds.menu                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackground.png')} />;
    this.backgrounds.menuRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteNotConnected.png')} />;
    this.backgrounds.menuRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteConnected.png')} />;
    this.backgrounds.mainDarkLogo            = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/backgroundWLogo.png')} />;
    this.backgrounds.mainDark                = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/background.png')} />;
  }

  componentWillUnmount() { // cleanup
    this.cleanUp()
  }

  getBackground(type, remotely) {
    let backgroundImage;
    switch (type) {
      case "menu":
        backgroundImage = this.backgrounds.menu;
        if (remotely === true) {
          backgroundImage = this.backgrounds.menuRemoteNotConnected;
        }
        break;
      case "dark":
        backgroundImage = this.backgrounds.main;
        if (remotely === true) {
          backgroundImage = this.backgrounds.mainRemoteNotConnected;
        }
        break;
      default:
        backgroundImage = this.backgrounds.main;
        if (remotely === true) {
          backgroundImage = this.backgrounds.mainRemoteNotConnected;
        }
        break;
    }

    return backgroundImage;
  }

  cleanUp() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    LOGDebug("RENDERING ROUTER");
    if (this.state.storeInitialized === true) {
      return (
        <View style={{flex:1, backgroundColor: colors.menuBackground.hex}}>
          <Router createReducer={reducerCreate} store={store} {...navBarStyle} getSceneStyle={() => {return {backgroundColor: colors.black.hex}}} backgrounds={this.backgrounds} getBackground={this.getBackground.bind(this)} eventBus={eventBus}>
            <Scene key="drawer" component={SideMenu} open={false} >
              <Scene key="Root" hideNavBar={false}>
                <Scene key="loginSplash"                component={Views.LoginSplash}                panHandlers={null} hideNavBar={true}  type="reset" initial={this.state.loggedIn === false} />
                <Scene key="login"                      component={Views.Login}                      panHandlers={null} hideNavBar={true}  />
                <Scene key="register"                   component={Views.Register}                   panHandlers={null} hideNavBar={false} title="Register" {...navBarStyle} />
                <Scene key="registerConclusion"         component={Views.RegisterConclusion}         panHandlers={null} hideNavBar={false} title="Almost Finished!" type="reset" {...navBarStyle} />
                <Scene key="pictureView"                component={Views.PictureView}                panHandlers={null} hideNavBar={true}  direction="vertical" />
                <Scene key="picturePreview"             component={Views.PicturePreview}             panHandlers={null} hideNavBar={true}  direction="vertical" />
                <Scene key="cameraRollView"             component={Views.CameraRollView}             panHandlers={null} hideNavBar={true}  direction="vertical" />
                <Scene key="aiStart"                    component={Views.AiStart}                    panHandlers={null} hideNavBar={false} direction="vertical" title="Hello!" />
                <Scene key="roomTraining_roomSize"      component={Views.RoomTraining_roomSize}      hideNavBar={true}  panHandlers={null} direction="vertical" />
                <Scene key="roomTraining"               component={Views.RoomTraining}               hideNavBar={true}  panHandlers={null} direction="horizontal" />
                <Scene key="roomSelection"              component={Views.RoomSelection}              panHandlers={null} hideNavBar={true}  direction="vertical" title="Move to which Room?" />
                <Scene key="roomIconSelection"          component={Views.RoomIconSelection}          panHandlers={null} hideNavBar={true}  direction="vertical" title="Pick an Icon" />
                <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        panHandlers={null} hideNavBar={true}  direction="vertical" title="Pick an Icon" />
                <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} panHandlers={null} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
                <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} panHandlers={null} hideNavBar={false} title="Recover Crownstone" />
                <Scene key="sphereOverview"             component={Views.SphereOverview}             panHandlers={null} hideNavBar={true}  initial={this.state.loggedIn} />
                <Scene key="roomOverview"               component={Views.RoomOverview}               panHandlers={null} hideNavBar={true}  />
                <Scene key="roomEdit"                   component={Views.RoomEdit}                   panHandlers={null} hideNavBar={false} title="Room Settings" />
                <Scene key="roomAdd"                    component={Views.RoomAdd}                    panHandlers={null} hideNavBar={true}  title="Create Room" />
                <Scene key="deviceEdit"                 component={Views.DeviceEdit}                 panHandlers={null} hideNavBar={false} title="Edit Device" />
                <Scene key="deviceEditLogic"            component={Views.DeviceEditLogic}            panHandlers={null} hideNavBar={false} title="Device Behaviour" />
                <Scene key="applianceSelection"         component={Views.ApplianceSelection}         panHandlers={null} hideNavBar={false} title="Select a Device" />
                <Scene key="deviceBehaviourEdit"        component={Views.DeviceBehaviourEdit}        panHandlers={null} hideNavBar={false} title="Edit Behaviour" />
                <Scene key="deviceStateEdit"            component={Views.DeviceStateEdit}            panHandlers={null} hideNavBar={false} />
                <Scene key="delaySelection"             component={Views.DelaySelection}             panHandlers={null} hideNavBar={false} title="Set Delay" />
                <Scene key="deviceScheduleEdit"         component={Views.DeviceScheduleEdit}         panHandlers={null} hideNavBar={false} title="Schedule"   rightTitle="Add" />
                <Scene key="deviceScheduleAdd"          component={Views.DeviceScheduleAdd}          panHandlers={null} hideNavBar={false} title="New Event"  rightTitle="Save" />
                <Scene key="daySelection"               component={Views.DaySelection}               panHandlers={null} hideNavBar={false} title="Set Active Days" />
                <Scene key="settingsOverview"           component={Views.SettingsOverview}           panHandlers={null} hideNavBar={false} title="Settings"/>
                <Scene key="settingsProfile"            component={Views.SettingsProfile}            panHandlers={null} hideNavBar={false} title="Your Profile" />
                <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}     panHandlers={null} hideNavBar={false} title="Sphere Overview" />
                <Scene key="settingsSphere"             component={Views.SettingsSphere}             panHandlers={null} hideNavBar={false} title="[Sphere name here]" />
                <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}         panHandlers={null} hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser}  panHandlers={null} hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}       panHandlers={null} hideNavBar={false} title="Invite" />
                <Scene key="appComplexity"              component={Views.AppComplexity}              panHandlers={null} hideNavBar={false} title="Settings"/>
              </Scene>
            </Scene>
          </Router>
          <OptionPopup />
          <Processing />
          <LocalizationSetupStep1 store={store} />
          <BleStateOverlay />
          <LocalizationSetupStep2 store={store} />
        </View>
      );
    }
    else {
      // this is the await store part.
      return <Background hideInterface={true} image={this.backgrounds.mainDarkLogo} />
    }
  }

}


class TabIcon extends Component {
  render(){
    return (
      <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
        <Icon
          name={this.props.iconString}
          size={31}
          color={this.props.selected ?  colors.menuTextSelected.hex : colors.menuText.hex}
          style={{backgroundColor:'transparent', padding:0, margin:0}}
        />
        <Text style={{
          fontSize:11,
          fontWeight:'200',
          color: (this.props.selected ?  colors.menuTextSelected.hex : colors.menuText.hex)
        }}>{this.props.tabTitle}</Text>
      </View>
    );
  }
}


let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};

