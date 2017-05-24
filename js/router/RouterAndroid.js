import * as React from 'react'; import { Component } from 'react';
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
import { eventBus }                  from '../util/EventBus'
import { reducerCreate }             from './store/reducers/navigation'
import { OptionPopup }               from '../views/components/OptionPopup'
import { Processing }                from '../views/components/Processing'
import { SideMenu }                  from '../views/components/SideMenu/SideMenu'
import { DfuOverlay }                from '../views/overlays/DfuOverlay'
import { ErrorOverlay }              from '../views/overlays/ErrorOverlay'
import { LocationPermissionOverlay } from '../views/overlays/LocationPermissionOverlay'
import { LocalizationSetupStep1 }    from '../views/overlays/LocalizationSetupStep1'
import { LocalizationSetupStep2 }    from '../views/overlays/LocalizationSetupStep2'
import { TapToToggleCalibration }    from '../views/overlays/TapToToggleCalibration'
import { BleStateOverlay }           from '../views/overlays/BleStateOverlay'
import { Views }                     from './Views'
import { styles, colors, screenWidth, screenHeight } from '../views/styles'

export class Router_Android extends Component {
  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.menuBackground.hex}}>
        <Router createReducer={reducerCreate} store={this.props.store} {...navBarStyle} getSceneStyle={() => {return {backgroundColor: colors.black.hex}}} backgrounds={this.props.backgrounds} getBackground={this.props.getBackground.bind(this)} eventBus={eventBus}>
          <Scene key="drawer" component={SideMenu} open={false} store={this.props.store}>
            <Scene key="Root" hideNavBar={false}>
              <Scene key="loginSplash"                component={Views.LoginSplash}                panHandlers={null} hideNavBar={true}  type="reset" initial={this.props.loggedIn === false} />
              <Scene key="login"                      component={Views.Login}                      panHandlers={null} hideNavBar={true}  />
              <Scene key="register"                   component={Views.Register}                   panHandlers={null} hideNavBar={false} title="Register" {...navBarStyle} />
              <Scene key="registerConclusion"         component={Views.RegisterConclusion}         panHandlers={null} hideNavBar={false} title="Almost Finished!" type="reset" {...navBarStyle} />
              <Scene key="pictureView"                component={Views.PictureView}                panHandlers={null} hideNavBar={true}  direction="vertical" />
              <Scene key="picturePreview"             component={Views.PicturePreview}             panHandlers={null} hideNavBar={true}  direction="vertical" />
              <Scene key="cameraRollView"             component={Views.CameraRollView}             panHandlers={null} hideNavBar={true}  direction="vertical" />
              <Scene key="aiStart"                    component={Views.AiStart}                    panHandlers={null} hideNavBar={false} direction="vertical" title="Hello!" />
              <Scene key="roomTraining_roomSize"      component={Views.RoomTraining_roomSize}      panHandlers={null} hideNavBar={true}  direction="vertical" />
              <Scene key="roomTraining"               component={Views.RoomTraining}               panHandlers={null} hideNavBar={true}  direction="horizontal" />
              <Scene key="roomSelection"              component={Views.RoomSelection}              panHandlers={null} hideNavBar={true}  direction="vertical" title="Move to which Room?" />
              <Scene key="roomIconSelection"          component={Views.RoomIconSelection}          panHandlers={null} hideNavBar={true}  direction="vertical" title="Pick an Icon" />
              <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        panHandlers={null} hideNavBar={true}  direction="vertical" title="Pick an Icon" />
              <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} panHandlers={null} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
              <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} panHandlers={null} hideNavBar={false} title="Recover Crownstone" />
              <Scene key="sphereOverview"             component={Views.SphereOverview}             panHandlers={null} hideNavBar={true}  initial={this.props.loggedIn} />
              <Scene key="roomOverview"               component={Views.RoomOverview}               panHandlers={null} hideNavBar={true}  />
              <Scene key="roomEdit"                   component={Views.RoomEdit}                   panHandlers={null} hideNavBar={false} title="Room Settings" />
              <Scene key="roomAdd"                    component={Views.RoomAdd}                    panHandlers={null} hideNavBar={true}  title="Create Room" />
              <Scene key="deviceEdit"                 component={Views.DeviceEdit}                 panHandlers={null} hideNavBar={false} title="Edit Device" />
              <Scene key="deviceEditLogic"            component={Views.DeviceEditLogic}            panHandlers={null} hideNavBar={false} title="Device Behaviour" />
              <Scene key="applianceSelection"         component={Views.ApplianceSelection}         panHandlers={null} hideNavBar={false} title="Select a Device" />
              <Scene key="deviceBehaviourEdit"        component={Views.DeviceBehaviourEdit}        panHandlers={null} hideNavBar={false} title="Edit Behaviour" />
              <Scene key="delaySelection"             component={Views.DelaySelection}             panHandlers={null} hideNavBar={false} title="Set Delay" />
              <Scene key="deviceScheduleEdit"         component={Views.DeviceScheduleEdit}         panHandlers={null} hideNavBar={false} title="Schedule"   rightTitle="Add" />
              <Scene key="deviceScheduleAdd"          component={Views.DeviceScheduleAdd}          panHandlers={null} hideNavBar={false} title="New Event"  rightTitle="Save" />
              <Scene key="daySelection"               component={Views.DaySelection}               panHandlers={null} hideNavBar={false} title="Set Active Days" />
              <Scene key="settingsOverview"           component={Views.SettingsOverview}           panHandlers={null} hideNavBar={false} title="Settings"/>
              <Scene key="settingsProfile"            component={Views.SettingsProfile}            panHandlers={null} hideNavBar={false} title="Your Profile" />
              <Scene key="settingsDeveloper"          component={Views.SettingsDeveloper}          panHandlers={null} hideNavBar={false} title="Developer" />
              <Scene key="settingsMeshOverview"       component={Views.SettingsMeshOverview}       panHandlers={null} hideNavBar={false} title="Mesh Overview" />
              <Scene key="settingsPrivacy"            component={Views.SettingsPrivacy}            panHandlers={null} hideNavBar={false} title="Developer" />
              <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}     panHandlers={null} hideNavBar={false} title="Sphere Overview" />
              <Scene key="settingsSphere"             component={Views.SettingsSphere}             panHandlers={null} hideNavBar={false} title="[Sphere name here]" />
              <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}         panHandlers={null} hideNavBar={false} title="[Username here]" />
              <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser}  panHandlers={null} hideNavBar={false} title="[Username here]" />
              <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}       panHandlers={null} hideNavBar={false} title="Invite" />
            </Scene>
          </Scene>
        </Router>
        <DfuOverlay store={this.props.store} />
        <LocalizationSetupStep1 store={this.props.store} />
        <LocalizationSetupStep2 store={this.props.store} />
        <TapToToggleCalibration store={this.props.store} />
        <BleStateOverlay />
        <LocationPermissionOverlay />
        <ErrorOverlay />
        <OptionPopup />
        <Processing />
      </View>
    );
  }
}


let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};

