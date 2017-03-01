import * as React from 'react'; import { Component } from 'react';
import {
  AppState,
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
import { eventBus }               from '../util/eventBus'
import { reducerCreate }          from './store/reducers/navigation'
import { OptionPopup }            from '../views/components/OptionPopup'
import { Processing }             from '../views/components/Processing'
import { LocalizationSetupStep1 } from '../views/components/overlays/LocalizationSetupStep1'
import { LocalizationSetupStep2 } from '../views/components/overlays/LocalizationSetupStep2'
import { TapToToggleCalibration } from '../views/components/overlays/TapToToggleCalibration'
import { BleStateOverlay }        from '../views/components/overlays/BleStateOverlay'
import { Views }                  from './Views'
import { styles, colors, screenWidth, screenHeight } from '../views/styles'
import { Icon } from '../views/components/Icon';


export class Router_IOS extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <Router createReducer={reducerCreate} store={this.props.store} {...navBarStyle} getSceneStyle={() => {return {backgroundColor: colors.menuBackground.hex}}} backgrounds={this.props.backgrounds} getBackground={this.props.getBackground.bind(this)} eventBus={eventBus}>
          <Scene key="Root" hideNavBar={false}>
            <Scene key="loginSplash"                component={Views.LoginSplash}                hideNavBar={true}  type="reset" initial={this.props.loggedIn === false} />
            <Scene key="login"                      component={Views.Login}                      hideNavBar={true}  />
            <Scene key="register"                   component={Views.Register}                   hideNavBar={false} title="Register" {...navBarStyle} />
            <Scene key="registerConclusion"         component={Views.RegisterConclusion}         hideNavBar={false} title="Almost Finished!" type="reset" {...navBarStyle} />
            <Scene key="pictureView"                component={Views.PictureView}                hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="picturePreview"             component={Views.PicturePreview}             hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="cameraRollView"             component={Views.CameraRollView}             hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="aiStart"                    component={Views.AiStart}                    hideNavBar={false} panHandlers={null} direction="vertical" title="Hello!" />
            <Scene key="roomTraining_roomSize"      component={Views.RoomTraining_roomSize}      hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="roomTraining"               component={Views.RoomTraining}               hideNavBar={true}  panHandlers={null} direction="horizontal" />
            <Scene key="roomSelection"              component={Views.RoomSelection}              hideNavBar={true}  panHandlers={null} direction="vertical" title="Move to which Room?" />
            <Scene key="roomIconSelection"          component={Views.RoomIconSelection}          hideNavBar={true}  panHandlers={null} direction="vertical" title="Pick an Icon" />
            <Scene key="roomAdd"                    component={Views.RoomAdd}                    hideNavBar={true}  title="Create Room" />
            <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        hideNavBar={true}  panHandlers={null} direction="vertical" title="Pick an Icon" />
            <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
            <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} hideNavBar={false} title="Recover Crownstone" />
            <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.props.loggedIn}>
              <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                <Scene key="sphereOverview"         component={Views.SphereOverview}             hideNavBar={true} />
                <Scene key="roomOverview"           component={Views.RoomOverview}               hideNavBar={true} />
                <Scene key="roomEdit"               component={Views.RoomEdit}                   hideNavBar={false} title="Room Settings" />
                <Scene key="deviceEdit"             component={Views.DeviceEdit}                 hideNavBar={false} title="Edit Device" />
                <Scene key="deviceEditLogic"        component={Views.DeviceEditLogic}            hideNavBar={false} title="Device Behaviour" />
                <Scene key="applianceSelection"     component={Views.ApplianceSelection}         hideNavBar={false} title="Select a Device" />
                <Scene key="deviceBehaviourEdit"    component={Views.DeviceBehaviourEdit}        hideNavBar={false} title="Edit Behaviour" />
                <Scene key="delaySelection"         component={Views.DelaySelection}             hideNavBar={false} title="Set Delay" />
                <Scene key="deviceScheduleEdit"     component={Views.DeviceScheduleEdit}         hideNavBar={false} title="Schedule"   rightTitle="Add" />
                <Scene key="deviceScheduleAdd"      component={Views.DeviceScheduleAdd}          hideNavBar={false} title="New Event"  rightTitle="Save" />
                <Scene key="daySelection"           component={Views.DaySelection}               hideNavBar={false} title="Set Active Days" />
              </Scene>
              <Scene key="settings" tabTitle="Settings" icon={TabIcon} iconString="ios-cog" {...navBarStyle}  initial={false} >
                <Scene key="settingsOverview"           component={Views.SettingsOverview}          hideNavBar={true} title="Settings"/>
                <Scene key="settingsProfile"            component={Views.SettingsProfile}           hideNavBar={false} title="Your Profile" />
                <Scene key="settingsPrivacy"            component={Views.SettingsPrivacy}           hideNavBar={false} title="Privacy" />
                <Scene key="settingsMeshOverview"       component={Views.SettingsMeshOverview}      hideNavBar={false} title="Mesh Overview" initial={false} />
                <Scene key="settingsDeveloper"          component={Views.SettingsDeveloper}         hideNavBar={false} title="Developer" />
                <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}    hideNavBar={false} title="Sphere Overview" />
                <Scene key="settingsSphere"             component={Views.SettingsSphere}            hideNavBar={false} title="[Sphere name here]" />
                <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}        hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser} hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}      hideNavBar={false} title="Invite" />
              </Scene>
            </Scene>
          </Scene>
        </Router>
        <LocalizationSetupStep1 store={this.props.store} />
        <LocalizationSetupStep2 store={this.props.store} />
        <TapToToggleCalibration store={this.props.store} />
        <BleStateOverlay />
        <OptionPopup />
        <Processing />
      </View>
    );
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
  backgroundColor:colors.menuBackground.hex,
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};


