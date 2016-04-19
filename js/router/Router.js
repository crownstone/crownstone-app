import React, {
  AppRegistry,
  Navigator,
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import {Scene, Reducer, Router, Switch, TabBar, Modal, Schema, Actions} from 'react-native-router-flux';
import { createStore } from 'redux'
import CrownstoneReducer from './store/reducer'

import { LoginSplash }         from '../views/loginViews/LoginSplash'
import { Login }               from '../views/loginViews/Login'
import { Register }            from '../views/loginViews/Register'
import { RegisterConclusion }  from '../views/loginViews/RegisterConclusion'
import { GroupOverview }       from '../views/GroupOverview'
import { RoomOverview }        from '../views/roomViews/RoomOverview'
import { RoomEdit }            from '../views/roomViews/RoomEdit'
import { DeviceEdit }          from '../views/deviceViews/DeviceEdit'
import { DeviceBehaviourEdit } from '../views/deviceViews/DeviceBehaviourEdit'
import { DeviceStateEdit }     from '../views/deviceViews/DeviceBehaviourStateEdit'
import { DelaySelection }      from '../views/deviceViews/DelaySelection'
import { DeviceScheduleEdit }  from '../views/deviceViews/DeviceScheduleEdit'
import { DeviceScheduleAdd }   from '../views/deviceViews/DeviceScheduleAdd'
import { DaySelection }        from '../views/deviceViews/DaySelection'
import { SettingsOverview }    from '../views/settingsViews/SettingsOverview'
import { ProfileSettings }     from '../views/settingsViews/ProfileSettings'
import { ChangePasswordSettings }  from '../views/settingsViews/ChangePasswordSettings'
import { ChangeEmailSettings }     from '../views/settingsViews/ChangeEmailSettings'
import { LocationSettings }    from '../views/settingsViews/LocationSettings'
import { GroupSettings }       from '../views/settingsViews/GroupSettings'
import { CrownstoneSettings }  from '../views/settingsViews/CrownstoneSettings'
import { AppComplexity }       from '../views/settingsViews/AppComplexity'
import {stylesIOS, colors}     from '../views/styles'
let styles = stylesIOS;

var Icon = require('react-native-vector-icons/Ionicons');

const store = createStore(CrownstoneReducer);

let inTabMenu = (state) => {
  if (state && state.children && state.children.length > 0) {
    return state.children[0].name = "tabBar";
  }
  return false;
};

let getActiveTabName = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    return tabBar.children[tabIndex].name;
  }
  return undefined;
};

let getTabTreeIndex = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    return tabBar.children[tabIndex].index;
  }
  return undefined;
};

let getTabRootName = (state) => {
  if (state && state.children && state.children.length > 0) {
    let tabBar = state.children[0];
    let tabIndex =  tabBar.index;
    let tabContainer = tabBar.children[tabIndex];
    return tabContainer.children[0].name;
  }
  return undefined;
};

const reducerCreate = params=> {
  const defaultReducer = Reducer(params);
  return (state, action)=> {
    // this part makes sure that when a menuIcon is pressed AND you are already in that menu tree,
    // it goes back to the root of that tree
    if (action.type === 'jump' && inTabMenu(state)) {
      let activeTabName = getActiveTabName(state);
      // We only want to reset if the icon is tapped when we're already in the view
      if (activeTabName === action.key) {
        // if we're already at root, do not do anything.
        if (getTabTreeIndex(state) === 0) {
          return state;
        }
        // snap to root.
        let rootName = getTabRootName(state);
        if (rootName) {
          console.log("ACTION", {key:rootName, type:'reset'});
          return defaultReducer(state, {key:rootName, type:'reset'});
        }
      }
    }
    console.log("ACTION", action);
    return defaultReducer(state, action);
  }
};

class TabIcon extends React.Component {
  render(){
    return (
    <View style={styles.centered} >
      <Icon name={this.props.iconString} size={30} color={this.props.selected ?  colors.menuTextSelected.h : colors.menuText.h} />
      <Text style={[styles.menuItem, {color:this.props.selected ?  colors.menuTextSelected.h : colors.menuText.h}]}>{this.props.title}</Text>
    </View>
    );
  }
}

let backButtonFunction = function(params) {
  //console.log("here", params, this)
  //if (this.props.navigationState.index === 0) {
  //  return null;
  //}
  //return (
  //    <TouchableOpacity style={[{
  //      width: 100,
  //      height: 37,
  //      position: 'absolute',
  //      bottom: 4,
  //      left: 2,
  //      padding: 8,
  //      justifyContent:'center',
  //  }]} onPress={Actions.pop}>
  //      <View style={{flexDirection:'row', alignItems:'center'}}>
  //        <Icon name="ios-arrow-back" size={25} color={'#ffffff'} style={{marginTop:2,paddingRight:6}} />
  //        <Text style={styles.topBarLeft}>Back</Text>
  //      </View>
  //    </TouchableOpacity>
  //);
};

let onRightFunctionEdit = function(params) {
  Actions.roomEdit({groupId: params.groupId, locationId: params.locationId});
};

let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.h},
  titleStyle:{color:'white'},
  //renderBackButton:backButtonFunction
};

export class AppRouter extends React.Component {
  constructor(props) {
    super();
    this.props = props;
  }

  render() {
    return <Router createReducer={reducerCreate} store={store} {...navBarStyle}>
      <Scene key="Root" hideNavBar={false}>
        <Scene key="loginSplash"            component={LoginSplash}        hideNavBar={true}  type="reset" />
        <Scene key="login"                  component={Login}              hideNavBar={true}  />
        <Scene key="register"               component={Register}           hideNavBar={false} title="Register" {...navBarStyle} />
        <Scene key="registerConclusion"     component={RegisterConclusion} hideNavBar={false} title="Registration Almost Finished" type="reset" {...navBarStyle} />
        <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarStyle={{backgroundColor:colors.menuBackground.h}} type="reset">
          <Scene key="overview" title="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
          <Scene key="groupOverview"        component={GroupOverview} title="Group Overview"  />
          <Scene key="roomOverview"         component={RoomOverview} onRight={onRightFunctionEdit} rightTitle="Edit" rightButtonTextStyle={{color:'white'}} />
          <Scene key="roomEdit"             component={RoomEdit} title="Edit Room" />
          <Scene key="deviceEdit"           component={DeviceEdit} title="Edit Device" />
          <Scene key="deviceBehaviourEdit"  component={DeviceBehaviourEdit} title="Edit Behaviour" />
          <Scene key="deviceStateEdit"      component={DeviceStateEdit} />
          <Scene key="delaySelection"       component={DelaySelection} title="Set Delay" />
          <Scene key="deviceScheduleEdit"   component={DeviceScheduleEdit} title="Schedule" onRight={onRightFunctionEdit} rightTitle="Add" />
          <Scene key="deviceScheduleAdd"    component={DeviceScheduleAdd} title="New Event" onRight={onRightFunctionEdit} rightTitle="Save" />
          <Scene key="daySelection"         component={DaySelection} title="Set Active Days" />
          </Scene>
          <Scene key="settings" title="Settings" icon={TabIcon} iconString="ios-gear-outline" {...navBarStyle} >
            <Scene key="Settings"               component={SettingsOverview} title="Settings"/>
            <Scene key="profileSettings"        component={ProfileSettings} title="Your Profile"/>
            <Scene key="ChangeEmailSettings"    component={ChangeEmailSettings} title="Change Email"/>
            <Scene key="changePasswordSettings" component={ChangePasswordSettings} title="Change Password"/>
            <Scene key="groupSettings"          component={GroupSettings} title="Manage our Group"/>
            <Scene key="locationSettings"       component={LocationSettings} title="Manage Your Rooms"/>
            <Scene key="crownstoneSettings"     component={CrownstoneSettings} title="Manage Your Crownstones"/>
            <Scene key="appComplexity"          component={AppComplexity} title="Settings"/>
          </Scene>
        </Scene>
      </Scene>
    </Router>;
  }
}
