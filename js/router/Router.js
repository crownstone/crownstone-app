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
import { Scene, Router, Actions } from 'react-native-router-flux';
import { StoreManager }           from './store/storeManager'
import { LocationHandler }        from '../native/LocationHandler'
import { AdvertisementHandler }   from '../native/AdvertisementHandler'
import { Scheduler }              from '../logic/Scheduler'
import { eventBus }               from '../util/eventBus'
import { logOut }                 from '../util/util'
import { userIsAdminInSphere }    from '../util/dataUtil'
import { LOG, LOGDebug }          from '../logging/Log'
import { INITIALIZER }            from '../initialize'
import { CLOUD }                  from '../cloud/cloudAPI'
import { reducerCreate }          from './store/reducers/navigation'
import { OptionPopup }            from '../views/components/OptionPopup'
import { Processing }             from '../views/components/Processing'
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
      INITIALIZER.start(store, eventBus);
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

      store.dispatch({type:"CLEAR_ACTIVE_SPHERE"});
      store.dispatch({type:"SET_REMOTE_SPHERE", data:{ remoteSphere: state.app.previouslyActiveSphere || Object.keys(state.spheres)[0]}});

      // pass the store to the singletons
      LocationHandler.loadStore(store);
      AdvertisementHandler.loadStore(store);
      Scheduler.loadStore(store);

      LOG("LOADED STORES");
      removeAllPresentUsers(store);
      clearAllCurrentPowerUsage(store); // power usage needs to be gathered again

      // // if we have an accessToken, we proceed with logging in automatically
      if (state.user.accessToken !== undefined) {
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

  cleanUp() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    LOGDebug("RENDERING ROUTER")
    if (this.state.storeInitialized === true) {
      return (
        <View style={{flex:1}}>
          <Router createReducer={reducerCreate} store={store} {...navBarStyle} backgrounds={this.backgrounds} getBackground={getBackground} eventBus={eventBus}>
            <Scene key="Root" hideNavBar={false}>
              <Scene key="loginSplash"                component={Views.LoginSplash}                hideNavBar={true}  type="reset" initial={this.state.loggedIn === false} />
              <Scene key="login"                      component={Views.Login}                      hideNavBar={true}  />
              <Scene key="register"                   component={Views.Register}                   hideNavBar={false} title="Register" {...navBarStyle} />
              <Scene key="registerConclusion"         component={Views.RegisterConclusion}         hideNavBar={false} title="Registration Almost Finished" type="reset" {...navBarStyle} />
              <Scene key="pictureView"                component={Views.PictureView}                hideNavBar={true}  panHandlers={null} direction="vertical" />
              <Scene key="picturePreview"             component={Views.PicturePreview}             hideNavBar={true}  panHandlers={null} direction="vertical" />
              <Scene key="cameraRollView"             component={Views.CameraRollView}             hideNavBar={true}  panHandlers={null} direction="vertical" />
              {/*<Scene key="setupWelcome"               component={Views.SetupWelcome}               hideNavBar={true}  type="reset"  direction="vertical" />*/}
              {/*<Scene key="setupAddSphere"             component={Views.SetupAddSphere}             hideNavBar={true}  />*/}
              {/*<Scene key="setupAddCrownstoneSelect"   component={Views.SetupAddCrownstoneSelect}   hideNavBar={true}  type="reset" />*/}
              {/*<Scene key="setupAddPluginStep1"        component={Views.SetupAddPlugInStep1}        hideNavBar={true}  />*/}
              {/*<Scene key="setupAddPluginStep2"        component={Views.SetupAddPlugInStep2}        hideNavBar={true}  />*/}
              {/*<Scene key="setupAddPluginStep3"        component={Views.SetupAddPlugInStep3}        hideNavBar={true}  />*/}
              {/*<Scene key="setupAddPluginStep4"        component={Views.SetupAddPlugInStep4}        hideNavBar={true}  />*/}
              {/*<Scene key="setupAddPlugInStepRecover"  component={Views.SetupAddPlugInStepRecover}  hideNavBar={true}  />*/}
              {/*<Scene key="setupAddBuiltinStep1"       component={Views.SetupAddPlugInStep1}        hideNavBar={true}  />*/}
              <Scene key="roomTraining"               component={Views.RoomTraining}               hideNavBar={true} direction="vertical" title="Training" />
              <Scene key="roomSelection"              component={Views.RoomSelection}              hideNavBar={true} panHandlers={null} direction="vertical" title="Move to which Room?" />
              <Scene key="roomIconSelection"          component={Views.SettingsRoomIconSelection}  hideNavBar={true} panHandlers={null} direction="vertical" title="Pick an Icon" />
              <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        hideNavBar={true} panHandlers={null} direction="vertical" title="Pick an Icon" />
              <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
              <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} hideNavBar={false} title="Recover Crownstone" />
              <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.state.loggedIn}>
                <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                  <Scene key="sphereOverview"         component={Views.SphereOverview}             title="Sphere Overview" onRight={ () => {Actions.roomAdd();} } rightTitle="Add" getRightTitle={renderAddRoomButton}/>
                  <Scene key="roomOverview"           component={Views.RoomOverview}               onRight={onRightFunctionEdit} rightTitle="Edit"  getRightTitle={renderEditRoomButton} />
                  <Scene key="roomEdit"               component={Views.RoomEdit}                   title="Room Settings" />
                  <Scene key="roomAdd"                component={Views.RoomAdd}                    title="Create Room" hideNavBar={true} />
                  <Scene key="deviceEdit"             component={Views.DeviceEdit}                 title="Edit Device" />
                  <Scene key="deviceEditLogic"        component={Views.DeviceEditLogic}            title="Device Behaviour" />
                  <Scene key="applianceSelection"     component={Views.ApplianceSelection}         title="Select a Device" />
                  <Scene key="deviceBehaviourEdit"    component={Views.DeviceBehaviourEdit}        title="Edit Behaviour" />
                  <Scene key="deviceStateEdit"        component={Views.DeviceStateEdit}            />
                  <Scene key="delaySelection"         component={Views.DelaySelection}             title="Set Delay" />
                  <Scene key="deviceScheduleEdit"     component={Views.DeviceScheduleEdit}         title="Schedule"  onRight={onRightFunctionEdit} rightTitle="Add" />
                  <Scene key="deviceScheduleAdd"      component={Views.DeviceScheduleAdd}          title="New Event" onRight={onRightFunctionEdit} rightTitle="Save" />
                  <Scene key="daySelection"           component={Views.DaySelection}               title="Set Active Days" />
                </Scene>
                <Scene key="settings" tabTitle="Settings" icon={TabIcon} iconString="ios-cog" {...navBarStyle}  initial={false} >
                  <Scene key="settingsOverview"           component={Views.SettingsOverview}            title="Settings"/>
                  <Scene key="settingsProfile"            component={Views.SettingsProfile}             title="Your Profile" />
                  <Scene key="settingsChangeEmail"        component={Views.SettingsChangeEmail}         title="Change Email"/>
                  <Scene key="settingsChangePassword"     component={Views.SettingsChangePassword}      title="Change Password"/>
                  <Scene key="settingsSphereOverview"      component={Views.SettingsSphereOverview}     title="Sphere Overview" />
                  <Scene key="settingsSphere"              component={Views.SettingsSphere}             title="[Sphere name here]" />
                  <Scene key="settingsSphereUser"          component={Views.SettingsSphereUser}         title="[Username here]" />
                  <Scene key="settingsSphereInvite"        component={Views.SettingsSphereInvite}       title="Invite" />
                  <Scene key="settingsCrownstoneOverview" component={Views.SettingsCrownstoneOverview}  title="Manage Your Crownstones"/>
                  <Scene key="settingsCrownstone"         component={Views.SettingsCrownstone}          title="Manage Crownstone"/>
                  <Scene key="settingsRoomOverview"       component={Views.SettingsRoomOverview}        title="Manage Rooms"/>
                  <Scene key="settingsRoomAdd"            component={Views.SettingsRoomAdd}             title="Create new Room"/>
                  <Scene key="settingsRoom"               component={Views.SettingsRoom}                title="Manage Room"/>
                  <Scene key="appComplexity"              component={Views.AppComplexity}               title="Settings"/>
                </Scene>
              </Scene>
            </Scene>
          </Router>
          <OptionPopup />
          <Processing />
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

let renderAddRoomButton = function(params) {
  let state = params.store.getState();
  if (state.app.activeSphere) {
    if (userIsAdminInSphere(state, state.app.activeSphere)) {
      return "Add";
    }
  }
  else if (state.app.currentSphere) {
    if (userIsAdminInSphere(state, state.app.currentSphere)) {
      return "Add";
    }
  }
  return "";
};
let renderEditRoomButton = function(params) {
  let state = params.store.getState();
  if (userIsAdminInSphere(state, params.sphereId)) {
    return "Edit";
  }
  return "";
};

let onRightFunctionEdit = function(params) {
  Actions.roomEdit({sphereId: params.sphereId, locationId: params.locationId, remote: params.remote});
};

let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};

var removeAllPresentUsers = function(store) {
  const state = store.getState();
  let spheres = state.spheres;
  let sphereIds = Object.keys(spheres);
  sphereIds.forEach((sphereId) => {
    let locations = spheres[sphereId].locations;
    let locationIds = Object.keys(locations);
    locationIds.forEach((locationId) => {
      store.dispatch({type:'CLEAR_USERS', sphereId:sphereId, locationId:locationId})
    })
  })
};

var clearAllCurrentPowerUsage = function(store) {
  const state = store.getState();
  let spheres = state.spheres;
  let sphereIds = Object.keys(spheres);
  sphereIds.forEach((sphereId) => {
    let stones = spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    stoneIds.forEach((stoneId) => {
      store.dispatch({type:'CLEAR_STONE_USAGE', sphereId:sphereId, stoneId:stoneId})
    })
  })
};

let getBackground = function(type) {
  let backgroundImage;
  switch (type) {
    case "menu":
      backgroundImage = this.props.backgrounds.menu;
      if (this.props.remote === true) {
        backgroundImage = this.props.backgrounds.menuRemoteNotConnected;
      }
      break;
    case "dark":
      backgroundImage = this.props.backgrounds.main;
      if (this.props.remote === true) {
        backgroundImage = this.props.backgrounds.mainRemoteNotConnected;
      }
      break;
    default:
      backgroundImage = this.props.backgrounds.main;
      if (this.props.remote === true) {
        backgroundImage = this.props.backgrounds.mainRemoteNotConnected;
      }
      break;
  }

  return backgroundImage;
};