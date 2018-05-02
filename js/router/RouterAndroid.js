import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';
import { Scene, Router, DefaultRenderer, Modal, Drawer } from 'react-native-router-flux';
import { eventBus }                  from '../util/EventBus'
import { Bluenet }                   from '../native/libInterface/Bluenet';
import { reducerCreate }             from './store/reducers/navigation'
import { OptionPopup }               from '../views/components/OptionPopup'
import { Processing }                from '../views/components/Processing'
import { DfuOverlay }                from '../views/overlays/DfuOverlay'
import { ErrorOverlay }              from '../views/overlays/ErrorOverlay'
import { LocationPermissionOverlay } from '../views/overlays/LocationPermissionOverlay'
import { LocalizationSetupStep1 }    from '../views/overlays/LocalizationSetupStep1'
import { LocalizationSetupStep2 }    from '../views/overlays/LocalizationSetupStep2'
import { LockOverlay }               from '../views/overlays/LockOverlay'
import { TapToToggleCalibration }    from '../views/overlays/TapToToggleCalibration'
import { SphereSelectionOverlay }    from "../views/overlays/SphereSelectionOverlay";
import { BleStateOverlay }           from '../views/overlays/BleStateOverlay'
import { WhatsNewOverlay }           from "../views/overlays/WhatsNewOverlay";
import { AnimatedMenu }              from "../views/components/animated/AnimatedMenu";
import { SideBar }                   from "../views/components/sideMenu/SideBar";

import { Views }                     from './Views'
import { colors, screenWidth} from '../views/styles'

export class Router_Android extends Component {
  componentDidMount() {
    Bluenet.viewsInitialized();
  }
  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.menuBackground.hex}}>
        <Router createReducer={reducerCreate} store={this.props.store} {...navBarStyle} getSceneStyle={() => {return {backgroundColor: colors.black.hex}}} backgrounds={this.props.backgrounds} getBackground={this.props.getBackground.bind(this)} eventBus={eventBus}>
          <Modal>
            <Scene key="loginSplash"                component={Views.LoginSplash}                hideNavBar={true} type="reset" initial={this.props.loggedIn === false} />
            <Scene key="login"                      component={Views.Login}                      hideNavBar={true} />
            <Scene key="logout"                     component={Views.Logout}                     hideNavBar={true} />
            <Scene key="tutorial"                   component={Views.Tutorial}                   />
            <Scene key="register"                   component={Views.Register}                   />
            <Scene key="registerConclusion"         component={Views.RegisterConclusion}         />
            <Scene key="pictureView"                component={Views.PictureView}                />
            <Scene key="cameraRollView"             component={Views.CameraRollView}             />
            <Scene key="aiStart"                    component={Views.AiStart}                    />
            <Scene key="roomTraining_roomSize"      component={Views.RoomTraining_roomSize}      />
            <Scene key="roomTraining"               component={Views.RoomTraining}               />
            <Scene key="roomSelection"              component={Views.RoomSelection}              />
            <Scene key="roomIconSelection"          component={Views.RoomIconSelection}          />
            <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        />
            <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} />
            <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} />
            <Scene key="selectFromList"             component={Views.SelectFromList}             />
            <Drawer
              hideNavBar
              key="drawer"
              contentComponent={SideBar}
              drawerWidth={0.75*screenWidth}
              initial={this.props.loggedIn}
            >
              <Scene key="sphereOverview"           component={Views.SphereOverview}             />
            </Drawer>
            <Scene key="roomOverview"               component={Views.RoomOverview}               />
            <Scene key="roomEdit"                   component={Views.RoomEdit}                   />
            <Scene key="roomAdd"                    component={Views.RoomAdd}                    />
            <Scene key="deviceEdit"                 component={Views.DeviceEdit}                 />
            <Scene key="deviceOverview"             component={Views.DeviceOverview}             />
            <Scene key="deviceScheduleEdit"         component={Views.DeviceScheduleEdit}         />
            <Scene key="applianceAdd"               component={Views.ApplianceAdd}               />
            <Scene key="applianceSelection"         component={Views.ApplianceSelection}         />
            <Scene key="deviceBehaviourEdit"        component={Views.DeviceBehaviourEdit}        />
            <Scene key="settingsApp"                component={Views.SettingsApp}                />
            <Scene key="settingsOverview"           component={Views.SettingsOverview}           />
            <Scene key="settingsProfile"            component={Views.SettingsProfile}            />
            <Scene key="settingsDeveloper"          component={Views.SettingsDeveloper}          />
            <Scene key="settingsBleDebug"           component={Views.SettingsBleDebug}           />
            <Scene key="settingsStoneBleDebug"      component={Views.SettingsStoneBleDebug}      />
            <Scene key="settingsMeshOverview"       component={Views.SettingsMeshOverview}       />
            <Scene key="settingsMeshTopology"       component={Views.SettingsMeshTopology}       />
            <Scene key="settingsMeshTopologyHelp"   component={Views.SettingsMeshTopologyHelp}   />
            <Scene key="settingsPrivacy"            component={Views.SettingsPrivacy}            />
            <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}     />
            <Scene key="settingsSphere"             component={Views.SettingsSphere}             />
            <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}         />
            <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser}  />
            <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}       />
            <Scene key="switchCraftInformation"     component={Views.SwitchCraftInformation}     />
            <Scene key="messageInbox"               component={Views.MessageInbox}               />
            <Scene key="messageAdd"                 component={Views.MessageAdd}                 />
          </Modal>
        </Router>

        <AnimatedMenu />
        <DfuOverlay  store={this.props.store} />
        <LockOverlay store={this.props.store} />
        <LocalizationSetupStep1 store={this.props.store} />
        <LocalizationSetupStep2 store={this.props.store} />
        <TapToToggleCalibration store={this.props.store} />
        <SphereSelectionOverlay store={this.props.store} />
        <LocationPermissionOverlay />
        <BleStateOverlay />
        <ErrorOverlay store={this.props.store} />
        <WhatsNewOverlay store={this.props.store} />
        <OptionPopup />
        <Processing />
      </View>
    );
  }
}


let navBarStyle = {
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
  backButtonImage: require('../images/androidBackIcon.png'),
  leftButtonIconStyle: {width:15, height:15, marginTop:8},
};

