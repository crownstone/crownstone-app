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
import { BleStateOverlay }           from '../views/overlays/BleStateOverlay'
import { WhatsNewOverlay }           from "../views/overlays/WhatsNewOverlay";
import { AnimatedMenu }              from "../views/components/animated/AnimatedMenu";
import { SideBar }                   from "../views/components/sideMenu/SideBar";
import { Icon }                      from "../views/components/Icon";
import { LibMessages }               from "../views/overlays/LibMessages";

import { Views }                     from './Views'
import { colors, screenWidth} from '../views/styles'

export class Router_Android extends Component {
  componentDidMount() {
    Bluenet.viewsInitialized();
  }
  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.menuBackground.hex}}>
        <Router
          createReducer={reducerCreate}
          store={this.props.store}
          {...navBarStyle}
          getSceneStyle={() => {return {backgroundColor: colors.black.hex}}}
          backgrounds={this.props.backgrounds}
          getBackground={this.props.getBackground.bind(this)}
          eventBus={eventBus}
        >
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
            <Scene key="settingsFactoryResetStep1"  component={Views.SettingsFactoryResetStep1}  />
            <Scene key="settingsFactoryResetStep2"  component={Views.SettingsFactoryResetStep2}  />
            <Scene key="selectFromList"             component={Views.SelectFromList}             />
            <Drawer
              hideNavBar
              key="drawer"
              drawerIcon={ <Icon name="md-menu" size={27} color={colors.white.hex} style={{paddingRight:6, marginTop:2}} /> }
              contentComponent={SideBar}
              drawerWidth={0.75*screenWidth}
              initial={this.props.loggedIn}
            >
              <Scene key="sphereOverview"           component={Views.SphereOverview}               />
            </Drawer>
            <Scene key="addItemsToSphere"            component={Views.AddItemsToSphere}            />
            <Scene key="roomOverview"                component={Views.RoomOverview}                />
            <Scene key="roomEdit"                    component={Views.RoomEdit}                    />
            <Scene key="roomAdd"                     component={Views.RoomAdd}                     />
            <Scene key="deviceEdit"                  component={Views.DeviceEdit}                  />
            <Scene key="deviceOverview"              component={Views.DeviceOverview}              />
            <Scene key="deviceScheduleEdit"          component={Views.DeviceScheduleEdit}          />
            <Scene key="applianceAdd"                component={Views.ApplianceAdd}                />
            <Scene key="applianceSelection"          component={Views.ApplianceSelection}          />
            <Scene key="deviceBehaviourEdit"         component={Views.DeviceBehaviourEdit}         />
            <Scene key="settingsApp"                 component={Views.SettingsApp}                 />
            <Scene key="settingsFAQ"                 component={Views.SettingsFAQ}                 />
            <Scene key="settingsOverview"            component={Views.SettingsOverview}            />
            <Scene key="settingsBleTroubleshooting"  component={Views.SettingsBleTroubleshooting}  />
            <Scene key="settingsDiagnostics"         component={Views.SettingsDiagnostics}         />
            <Scene key="settingsProfile"             component={Views.SettingsProfile}             />
            <Scene key="settingsDeveloper"           component={Views.SettingsDeveloper}           />
            <Scene key="settingsBleDebug"            component={Views.SettingsBleDebug}            />
            <Scene key="settingsLogging"             component={Views.SettingsLogging}             />
            <Scene key="settingsStoneBleDebug"       component={Views.SettingsStoneBleDebug}       />
            <Scene key="settingsMeshOverview"        component={Views.SettingsMeshOverview}        />
            <Scene key="settingsMeshTopology"        component={Views.SettingsMeshTopology}        />
            <Scene key="settingsMeshTopologyHelp"    component={Views.SettingsMeshTopologyHelp}    />
            <Scene key="settingsMeshDebug"           component={Views.SettingsMeshDebug}           />
            <Scene key="settingsRedownloadFromCloud" component={Views.SettingsRedownloadFromCloud} />
            <Scene key="settingsPrivacy"             component={Views.SettingsPrivacy}             />
            <Scene key="switchCraftInformation"      component={Views.SwitchCraftInformation}      />
            <Scene key="settingsLocalizationDebug"   component={Views.SettingsLocalizationDebug}   />

            <Scene key="toonAdd"                    component={Views.ToonAdd}   initial={false}  />
            <Scene key="sphereEdit"                 component={Views.SphereEdit}                 panHandlers={null} />
            <Scene key="sphereEditSettings"         component={Views.SphereEditSettings}         panHandlers={null} />
            <Scene key="sphereRoomOverview"         component={Views.SphereRoomOverview}         panHandlers={null} />
            <Scene key="sphereCrownstoneOverview"   component={Views.SphereCrownstoneOverview}   panHandlers={null} />
            <Scene key="sphereRoomArranger"         component={Views.SphereRoomArranger}         panHandlers={null} />
            <Scene key="sphereUserOverview"         component={Views.SphereUserOverview}         panHandlers={null} />
            <Scene key="sphereUserInvite"           component={Views.SphereUserInvite}           panHandlers={null} />
            <Scene key="sphereInvitedUser"          component={Views.SphereInvitedUser}          panHandlers={null} />
            <Scene key="sphereUser"                 component={Views.SphereUser}                 panHandlers={null} />
            <Scene key="sphereBehaviour"            component={Views.SphereBehaviour}            panHandlers={null} />
            <Scene key="sphereIntegrations"         component={Views.SphereIntegrations}         panHandlers={null} />

            <Scene key="toonAdd"                    component={Views.ToonAdd}                    panHandlers={null} />
            <Scene key="toonSettings"               component={Views.ToonSettings}               panHandlers={null} />
            <Scene key="toonOverview"               component={Views.ToonOverview}               panHandlers={null} />

            <Scene key="messageInbox"               component={Views.MessageInbox}               />
            <Scene key="messageAdd"                 component={Views.MessageAdd}                 />

            <Scene key="iconDebug"                  component={Views.IconDebug}  initial={false} />
          </Modal>
        </Router>

        <AnimatedMenu />
        <LibMessages  />
        <DfuOverlay  store={this.props.store} />
        <LockOverlay store={this.props.store} />
        <LocalizationSetupStep1 store={this.props.store} />
        <LocalizationSetupStep2 store={this.props.store} />
        <TapToToggleCalibration store={this.props.store} />
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

