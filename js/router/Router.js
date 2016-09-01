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
import { NativeEventsBridge }           from '../native/NativeEventsBridge'
import { eventBus }               from '../util/eventBus'
import { logOut }                 from '../util/util'
import { INITIALIZER }            from '../util/initialize'
import { CLOUD }                  from '../cloud/cloudAPI'
import { reducerCreate }          from './store/reducers/navigation'
import { OptionPopup }            from '../views/components/OptionPopup'
import { Processing }             from '../views/components/Processing'
import { Background }             from '../views/components/Background'
import { Views }                  from './Views'
import { AdvertisementManager }   from '../logic/CrownstoneControl'
import { styles, colors }         from '../views/styles'
import { Icon } from '../views/components/Icon';

let store = {};

export class AppRouter extends Component {
  constructor() {
    super();
    this.state = {initialized:false, loggedIn: false};
    this.unsubscribe = [];
  }



  componentDidMount() {
    // check what we should do with this data.
    let interpretData = () => {
      store = StoreManager.getStore();
      INITIALIZER.start(store, eventBus)
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


      store.dispatch({type:"CLEAR_ACTIVE_GROUP"});

      // pass the store to the singletons
      NativeEventsBridge.loadStore(store);
      AdvertisementManager.loadStore(store);
      removeAllPresentUsers(store);
      clearAllCurrentPowerUsage(store); // power usage needs to be gathered again

      // TODO: restore validation
      // // if we have an accessToken, we proceed with logging in automatically
      if (state.user.accessToken !== undefined) {
      //   // in the background we check if we're authenticated, if not we log out.
        CLOUD.setAccess(state.user.accessToken);
      //   CLOUD.getUserData({background:true})
      //     .then((reply) => {
      //       console.log("received verification", reply)
      //     })
      //     .catch((reply) => {
      //       console.log("received ERROR", reply);
      //       if (reply.status === 401) {
      //         logOut();
      //         Alert.alert("Please log in again.", undefined, [{text:'OK'}])
      //       }
      //     });
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
    if (StoreManager.isInitialized === true) {
      interpretData();
    }
    else
      this.unsubscribe.push(eventBus.on('storeInitialized', interpretData));
  }

  componentWillUnmount() { // cleanup
    this.cleanUp()
  }

  cleanUp() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    if (this.state.storeInitialized === true) {
      return (
        <View style={{flex:1}}>
          <Router createReducer={reducerCreate} store={store} {...navBarStyle} eventBus={eventBus}>
            <Scene key="Root" hideNavBar={false}>
              <Scene key="loginSplash"                component={Views.LoginSplash}                hideNavBar={true}  type="reset" initial={this.state.loggedIn === false} />
              <Scene key="login"                      component={Views.Login}                      hideNavBar={true}  />
              <Scene key="register"                   component={Views.Register}                   hideNavBar={false} title="Register" {...navBarStyle} />
              <Scene key="registerConclusion"         component={Views.RegisterConclusion}         hideNavBar={false} title="Registration Almost Finished" type="reset" {...navBarStyle} />
              <Scene key="pictureView"                component={Views.PictureView}                hideNavBar={true}  direction="vertical" />
              <Scene key="picturePreview"             component={Views.PicturePreview}             hideNavBar={true}  direction="vertical" />
              <Scene key="cameraRollView"             component={Views.CameraRollView}             hideNavBar={true}  direction="vertical" />
              <Scene key="setupWelcome"               component={Views.SetupWelcome}               hideNavBar={true}  type="reset"  direction="vertical" />
              <Scene key="setupAddGroup"              component={Views.SetupAddGroup}              hideNavBar={true}  />
              <Scene key="setupAddCrownstoneSelect"   component={Views.SetupAddCrownstoneSelect}   hideNavBar={true}  type="reset" />
              <Scene key="setupAddPluginStep1"        component={Views.SetupAddPlugInStep1}        hideNavBar={true}  />
              <Scene key="setupAddPluginStep2"        component={Views.SetupAddPlugInStep2}        hideNavBar={true}  />
              <Scene key="setupAddPluginStep3"        component={Views.SetupAddPlugInStep3}        hideNavBar={true}  />
              <Scene key="setupAddPluginStep4"        component={Views.SetupAddPlugInStep4}        hideNavBar={true}  />
              <Scene key="setupAddPlugInStepRecover"  component={Views.SetupAddPlugInStepRecover}  hideNavBar={true}  />
              <Scene key="setupAddBuiltinStep1"       component={Views.SetupAddPlugInStep1}        hideNavBar={true}  />
              <Scene key="roomTraining"               component={Views.SettingsRoomTraining}       hideNavBar={true} direction="vertical" title="Training" />
              <Scene key="roomIconSelection"          component={Views.SettingsRoomIconSelection}  hideNavBar={true} panHandlers={null} direction="vertical" title="Pick an Icon" />
              <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        hideNavBar={true} panHandlers={null} direction="vertical" title="Pick an Icon" />
              <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
              <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} hideNavBar={false} title="Recover Crownstone" />
              <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.state.loggedIn}>
                <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                  <Scene key="groupOverview"          component={Views.GroupOverview}              title="Group Overview"  />
                  <Scene key="roomOverview"           component={Views.RoomOverview}               onRight={onRightFunctionEdit} rightTitle="Edit" rightButtonTextStyle={{color:'white'}} />
                  <Scene key="roomEdit"               component={Views.RoomEdit}                   title="Configure Devices" />
                  <Scene key="deviceEdit"             component={Views.DeviceEdit}                 title="Edit Device" />
                  <Scene key="applianceSelection"     component={Views.ApplianceSelection}         title="Devices" />
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
                  <Scene key="settingsGroupOverview"      component={Views.SettingsGroupOverview}       title="Group Overview" />
                  <Scene key="settingsGroup"              component={Views.SettingsGroup}               title="[Group name here]" />
                  <Scene key="settingsGroupUser"          component={Views.SettingsGroupUser}           title="[Username here]" />
                  <Scene key="settingsGroupInvite"        component={Views.SettingsGroupInvite}         title="Invite" />
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
      return <Background hideInterface={true} background={require('../images/loginBackground.png')} />
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

let onRightFunctionEdit = function(params) {
  Actions.roomEdit({groupId: params.groupId, locationId: params.locationId});
};

let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};

var removeAllPresentUsers = function(store) {
  const state = store.getState();
  let groups = state.groups;
  let groupIds = Object.keys(groups);
  groupIds.forEach((groupId) => {
    let locations = groups[groupId].locations;
    let locationIds = Object.keys(locations);
    locationIds.forEach((locationId) => {
      store.dispatch({type:'CLEAR_USERS', groupId:groupId, locationId:locationId})
    })
  })
};

var clearAllCurrentPowerUsage = function(store) {
  const state = store.getState();
  let groups = state.groups;
  let groupIds = Object.keys(groups);
  groupIds.forEach((groupId) => {
    let stones = groups[groupId].stones;
    let stoneIds = Object.keys(stones);
    stoneIds.forEach((stoneId) => {
      store.dispatch({type:'CLEAR_STONE_USAGE', groupId:groupId, stoneId:stoneId})
    })
  })
};
