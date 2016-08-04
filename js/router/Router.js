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
import { store, storeInitialized } from './store/store'
import { NativeBridge }           from '../native/NativeBridge'
import { eventBus }               from '../util/eventBus'
import { logOut }                 from '../util/util'
import { CLOUD }                  from '../cloud/cloudAPI'
import { reducerCreate }          from './store/reducers/navigation'
import { OptionPopup }            from '../views/components/OptionPopup'
import { Processing }             from '../views/components/Processing'
import { Background }             from '../views/components/Background'
import { Views }                  from './Views'
import { AdvertisementManager }   from '../logic/CrownstoneControl'
import { styles, colors }         from '../views/styles'

import Icon from 'react-native-vector-icons/Ionicons'

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

// configure the CLOUD network handler.
CLOUD.setNetworkErrorHandler((error) => {
  Alert.alert("Connection Problem", "Could not connect to the Cloud. Please check your internet connection.",[{text:'OK'}]);
});

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

var clearAllPowerusage = function(store) {
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

export class AppRouter extends Component {
  constructor() {
    super();
    this.state = {initialized:false, loggedIn: false};
    this.unsubscribe = [];
  }

  componentDidMount() {
    let dataLoginValidation = () => {
      let state = store.getState();

      // if we have an accessToken, we proceed with logging in automatically
      if (state.user.accessToken !== undefined) {

        // in the background we check if we're authenticated, if not we log out.
        CLOUD.setAccess(state.user.accessToken);
        CLOUD.getUserData({background:true})
          .then((reply) => {
            console.log("received verification", reply)
          })
          .catch((reply) => {
            console.log("received ERROR", reply);
            if (reply.status === 401) {
              logOut();
              Alert.alert("Please log in again.", undefined, [{text:'OK'}])
            }
          });

        this.setState({initialized:true, loggedIn:true});
      }
      else {
        this.setState({initialized:true, loggedIn:false});
      }
    };

    // there can be a race condition where the event has already been fired before this module has initialized
    // This check is to ensure that it doesn't matter what comes first.
    if (storeInitialized === true) {
      // give the native bridge a reference to the store
      NativeBridge.loadStore(store);
      AdvertisementManager.loadStore(store);
      removeAllPresentUsers(store);
      clearAllPowerusage(store);
      dataLoginValidation();
    }
    else
      this.unsubscribe.push(eventBus.on('storeInitialized', dataLoginValidation));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    if (this.state.initialized === true) {
      return (
        <View style={{flex:1}}>
          <Router createReducer={reducerCreate} store={store} {...navBarStyle} eventBus={eventBus}>
            <Scene key="Root" hideNavBar={false}>
              <Scene key="loginSplash"              component={Views.LoginSplash}               hideNavBar={true}  type="reset" initial={this.state.loggedIn === false} />
              <Scene key="login"                    component={Views.Login}                     hideNavBar={true}  />
              <Scene key="register"                 component={Views.Register}                  hideNavBar={false} title="Register" {...navBarStyle} />
              <Scene key="registerConclusion"       component={Views.RegisterConclusion}        hideNavBar={false} title="Registration Almost Finished" type="reset" {...navBarStyle} />
              <Scene key="pictureView"              component={Views.PictureView}               hideNavBar={true}  direction="vertical" />
              <Scene key="picturePreview"           component={Views.PicturePreview}            hideNavBar={true}  direction="vertical" />
              <Scene key="cameraRollView"           component={Views.CameraRollView}            hideNavBar={true}  direction="vertical" />
              <Scene key="setupWelcome"             component={Views.SetupWelcome}              hideNavBar={true}  type="reset"  direction="vertical" />
              <Scene key="setupAddGroup"            component={Views.SetupAddGroup}             hideNavBar={true}  />
              <Scene key="setupAddCrownstoneSelect" component={Views.SetupAddCrownstoneSelect}  hideNavBar={true}  type="reset" />
              <Scene key="setupAddPluginStep1"      component={Views.SetupAddPlugInStep1}       hideNavBar={true}  />
              <Scene key="setupAddPluginStep2"      component={Views.SetupAddPlugInStep2}       hideNavBar={true}  />
              <Scene key="setupAddPluginStep3"      component={Views.SetupAddPlugInStep3}       hideNavBar={true}  />
              <Scene key="setupAddPluginStep4"      component={Views.SetupAddPlugInStep4}       hideNavBar={true}  />
              <Scene key="setupAddPlugInStepRecover" component={Views.SetupAddPlugInStepRecover}       hideNavBar={true}  />
              <Scene key="setupAddBuiltinStep1"     component={Views.SetupAddPlugInStep1}       hideNavBar={true}  />
              <Scene key="roomTraining"             component={Views.RoomTraining}              hideNavBar={true}  direction="vertical" title="Training" />
              <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.state.loggedIn}>
                <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                  <Scene key="groupOverview"          component={Views.GroupOverview}       title="Group Overview"  />
                  <Scene key="roomOverview"           component={Views.RoomOverview}        onRight={onRightFunctionEdit} rightTitle="Edit" rightButtonTextStyle={{color:'white'}} />
                  <Scene key="roomEdit"               component={Views.RoomEdit}            title="Edit Room" />
                  <Scene key="deviceEdit"             component={Views.DeviceEdit}          title="Edit Device" />
                  <Scene key="deviceBehaviourEdit"    component={Views.DeviceBehaviourEdit} title="Edit Behaviour" />
                  <Scene key="deviceStateEdit"        component={Views.DeviceStateEdit} />
                  <Scene key="delaySelection"         component={Views.DelaySelection}      title="Set Delay" />
                  <Scene key="deviceScheduleEdit"     component={Views.DeviceScheduleEdit}  title="Schedule" onRight={onRightFunctionEdit} rightTitle="Add" />
                  <Scene key="deviceScheduleAdd"      component={Views.DeviceScheduleAdd}   title="New Event" onRight={onRightFunctionEdit} rightTitle="Save" />
                  <Scene key="daySelection"           component={Views.DaySelection}        title="Set Active Days" />
                </Scene>
                <Scene key="settings" tabTitle="Settings" icon={TabIcon} iconString="ios-cog" {...navBarStyle}  initial={false} >
                  <Scene key="settingsOverview"       component={Views.SettingsOverview}    title="Settings"/>
                  <Scene key="settingsProfile"        component={Views.SettingsProfile}     title="Your Profile" />
                  <Scene key="settingsChangeEmail"    component={Views.SettingsChangeEmail} title="Change Email"/>
                  <Scene key="settingsChangePassword" component={Views.SettingsChangePassword} title="Change Password"/>
                  <Scene key="settingsGroupIndex"     component={Views.SettingsGroupIndex}     title="Groups" />
                  <Scene key="settingsGroups"         component={Views.SettingsGroup}       title="[Group name here]" onRight={onRightFunctionEdit} rightTitle="Add"/>
                  <Scene key="settingsInvite"         component={Views.SettingsInvite}      title="Invite" />
                  <Scene key="settingsRooms"          component={Views.SettingsRooms}       title="Manage Your Rooms"/>
                  <Scene key="settingsCrownstones"    component={Views.SettingsCrownstones} title="Manage Your Crownstones"/>
                  <Scene key="appComplexity"          component={Views.AppComplexity}       title="Settings"/>
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
