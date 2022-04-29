// In App.js in a new project

import * as React from 'react';
import { Image, View, Text, TouchableOpacity } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  drawerNavigationContainer,
  navigationRef,
  tabBarNavigationContainer,
} from "./RootNavigation";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Component } from "react";
import { Bluenet } from "../native/libInterface/Bluenet";

import { AddSphereTutorial }                  from "../views/main/addSphereTutorial/AddSphereTutorial";
import { AlexaOverview }                      from "../views/thirdParty/alexa/AlexaOverview";

import { AddItemsToSphere }                   from '../views/main/AddItemsToSphere'
import { DeviceOverview }                     from '../views/deviceViews/DeviceOverview'
import { DeviceEdit }                         from '../views/deviceViews/DeviceEdit'
import { DeviceIconSelection }                from '../views/deviceViews/DeviceIconSelection'
import { LoginSplash }                        from '../views/startupViews/LoginSplash'
import { Login }                              from '../views/startupViews/Login'
import { Logout }                             from "../views/startupViews/Logout";
import { MessageInbox }                       from '../views/messaging/MessageInbox'
import { MessageAdd }                         from '../views/messaging/MessageAdd'
import { Register }                           from '../views/startupViews/Register'
import { RoomOverview }                       from '../views/roomViews/RoomOverview'
import { RoomEdit }                           from '../views/roomViews/RoomEdit'
import { RoomAdd }                            from '../views/roomViews/RoomAdd'
import { RoomTraining }                       from '../views/roomViews/RoomTraining'
import { RoomTraining_roomSize }              from '../views/roomViews/RoomTraining_roomSize'
import { RoomIconSelection }                  from '../views/roomViews/RoomIconSelection'
import { SphereOverview }                     from '../views/main/SphereOverview'
import { SelectFromList }                     from '../views/selection/SelectFromList'
import { SphereEdit }                         from '../views/main/SphereEdit'
import { SphereEditSettings }                 from '../views/main/editSubviews/SphereEditSettings'
import { SphereRoomOverview }                 from "../views/main/editSubviews/SphereRoomOverview";
import { SphereCrownstoneOverview }           from "../views/main/editSubviews/SphereCrownstoneOverview";
import { SphereRoomArranger }                 from "../views/main/editSubviews/SphereRoomArranger";
import { SphereUserInvite }                   from "../views/main/editSubviews/SphereUserInvite";
import { SphereUserOverview }                 from "../views/main/editSubviews/SphereUserOverview";
import { SphereInvitedUser }                  from "../views/main/editSubviews/SphereInvitedUser";
import { SphereUser }                         from "../views/main/editSubviews/SphereUser";
import { SphereIntegrations }                 from "../views/main/editSubviews/SphereIntegrations";

import { SettingsApp }                        from '../views/settingsViews/SettingsApp'
import { SettingsBleDebug }                   from '../views/settingsViews/dev/SettingsBleDebug'
import { SettingsDeveloper }                  from '../views/settingsViews/dev/SettingsDeveloper'
import { SettingsDiagnostics }                from '../views/settingsViews/SettingsDiagnostics'
import { SettingsFactoryResetStep1 }          from '../views/settingsViews/SettingsFactoryResetStep1'
import { SettingsFactoryResetStep2 }          from '../views/settingsViews/SettingsFactoryResetStep2'
import { SettingsFAQ }                        from "../views/settingsViews/SettingsFAQ";
import { SettingsLocalizationDebug }          from '../views/settingsViews/dev/SettingsLocalizationDebug'
import { SettingsLogging }                    from "../views/settingsViews/dev/SettingsLogging";
// import { SettingsMeshOverview }               from '../views/settingsViews/SettingsMeshOverview'
// import { SettingsMeshTopology}                from '../views/settingsViews/SettingsMeshTopology'
import { SettingsMeshTopologyHelp }           from "../views/settingsViews/SettingsMeshTopologyHelp";
import { SettingsOverview }                   from '../views/settingsViews/SettingsOverview'
import { SettingsProfile }                    from '../views/settingsViews/SettingsProfile'
import { SettingsPrivacy }                    from '../views/settingsViews/SettingsPrivacy'
import { SettingsRedownloadFromCloud }        from '../views/settingsViews/SettingsRedownloadFromCloud'
import { SettingsStoneBleDebug }              from '../views/settingsViews/dev/SettingsStoneBleDebug'
import { SettingsBleTroubleshooting }         from '../views/settingsViews/SettingsBleTroubleshooting'
import { IconDebug }                          from "../views/development/IconDebug";
import { ToonAdd }                            from "../views/thirdParty/toon/ToonAdd";
import { ToonSettings }                       from "../views/thirdParty/toon/ToonSettings";
import { ToonOverview }                       from "../views/thirdParty/toon/ToonOverview";
import { DeviceSmartBehaviour }               from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour";
import { DeviceSmartBehaviour_TypeSelector }  from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour_TypeSelector";
import { DeviceSmartBehaviour_Editor }        from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour_Editor";
import { DeviceSmartBehaviour_Wrapup }        from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour_Wrapup";
import { AddCrownstone }                      from "../views/addingCrownstones/AddCrownstone";
import { ScanningForSetupCrownstones }        from "../views/addingCrownstones/ScanningForSetupCrownstones";
import { SetupCrownstone }                    from "../views/addingCrownstones/SetupCrownstone";
import { DfuIntroduction }                    from "../views/dfu/DfuIntroduction";
import { DfuScanning }                        from "../views/dfu/DfuScanning";
import { DfuBatch }                           from "../views/dfu/DfuBatch";
import { DfuFinished }                        from "../views/dfu/DfuFinished";
import { Processing }                         from "../views/overlays/Processing";
import { AicoreTimeCustomizationOverlay }     from "../views/overlays/AicoreTimeCustomizationOverlay";
import { BleStateOverlay }                    from "../views/overlays/BleStateOverlay";
import { ErrorOverlay }                       from "../views/overlays/ErrorOverlay";
import { LibMessages }                        from "../views/overlays/LibMessages";
import { ListOverlay }                        from "../views/overlays/ListOverlay";
import { LocalizationSetupStep1 }             from "../views/overlays/LocalizationSetupStep1";
import { LocalizationSetupStep2 }             from "../views/overlays/LocalizationSetupStep2";
import { LocationPermissionOverlay }          from "../views/overlays/LocationPermissionOverlay";
import { LockOverlay }                        from "../views/overlays/LockOverlay";
import { SimpleOverlay }                      from "../views/overlays/SimpleOverlay";
import { OptionPopup }                        from "../views/overlays/OptionPopup";
import { DeviceAbilities }                    from "../views/deviceViews/DeviceAbilities";
import { Ability_DimmerSettings }             from "../views/deviceViews/abilities/settings/Ability_DimmerSettings";
import { Ability_SwitchcraftInformation }     from "../views/deviceViews/abilities/information/Ability_SwitchcraftInformation";
import { Ability_TapToToggleSettings }        from "../views/deviceViews/abilities/settings/Ability_TapToToggleSettings";
import { Ability_SwitchcraftSettings }        from "../views/deviceViews/abilities/settings/Ability_SwitchcraftSettings";
import { Ability_TapToToggleInformation }     from "../views/deviceViews/abilities/information/Ability_TapToToggleInformation";
import { DevicePowerUsage }                   from "../views/deviceViews/DevicePowerUsage";
import { DeviceSmartBehaviour_CopyStoneSelection } from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour_CopyStoneSelection";
import { DeviceSmartBehaviour_BehaviourSelector }  from "../views/deviceViews/smartBehaviour/DeviceSmartBehaviour_BehaviourSelector";
import { NumericOverlay }                     from "../views/overlays/NumericOverlay";
import { DEV_UserData }                       from "../views/dev/user/DEV_UserDataSpheres";
import { DEV_PresenceMocking }                from "../views/dev/PresenceMocking/DEV_PresenceMocking";
import { DEV_FirmwareTest }                   from "../views/dev/firmwareTesting/DEV_FirmwareTest";
import { DEV_AdvancedConfig }                 from "../views/dev/firmwareTesting/DEV_AdvancedConfig";
import { DEV_DFU }                            from "../views/dev/firmwareTesting/DEV_DFU";
import { DEV_StoneSelector }                  from "../views/dev/stoneSelecting/DEV_StoneSelector";
import { DEV_RawAdvertisements }              from "../views/dev/firmwareTesting/DEV_RawAdvertisements";
import { SphereEditMap }                      from "../views/main/editSubviews/SphereEditMap";
import { SettingsDatabaseExplorer }           from "../views/settingsViews/dev/SettingsDatabaseExplorer";
import { DEV_Batching }                       from "../views/dev/batching/DEV_Batching";
import { SettingsUptime }                     from "../views/settingsViews/dev/SettingsUptime";
import { ScenesOverview }                     from "../views/scenesViews/ScenesOverview";
import { SceneAdd }                           from "../views/scenesViews/SceneAdd";
import { ScenePictureGallery }                from "../views/scenesViews/ScenePictureGallery";
import { SceneEdit }                          from "../views/scenesViews/SceneEdit";
import { SceneSelectCrownstones }             from "../views/scenesViews/SceneSelectCrownstones";
import { SettingsLocalizationMonitor }        from "../views/settingsViews/dev/SettingsLocalizationMonitor";
import { DimLevelOverlay }                    from "../views/overlays/DimLevelOverlay";
import { GoogleAssistantOverview }            from "../views/thirdParty/google/GoogleAssistantOverview";
import { PermissionIntroduction }             from "../views/startupViews/PermissionIntroduction";
import { HueOverview }                        from "../views/thirdParty/hue/HueOverview";
import { HueAdd }                             from "../views/thirdParty/hue/HueAdd";
import { SetupHub }                           from "../views/addingCrownstones/SetupHub";
import { HubOverview }                        from "../views/hubViews/HubOverview";
import { SphereHubOverview }                  from "../views/main/editSubviews/SphereHubOverview";
import { HubEdit }                            from "../views/hubViews/HubEdit";
import { Initializer }                        from "./startupViews/Initializer";
import { TextInputOverlay }                   from "./overlays/TextInputOverlay";
import { SettingsDevHub }                     from "./settingsViews/dev/SettingsDevHub";
import { SettingsLogLevelConfig }             from "./settingsViews/dev/SettingsLogLevelConfig";
import { SettingsLogOverview }                from "./settingsViews/dev/SettingsLogOverview";
import { RoomTrainingStep1 }                  from "./roomViews/RoomTrainingStep1";
import { RoomTrainingStep1_train }            from "./roomViews/RoomTrainingStep1_train";
import { LocalizationMenu }                   from "./main/localization/LocalizationMenu";
import { SetupLocalization }                  from "./main/localization/SetupLocalization";
import { SphereOverviewSideBar }              from "./sidebars/SphereOverviewSideBar";
import { core } from "../Core";
import {createDrawerNavigator} from "@react-navigation/drawer";
import {colors} from "./styles";
import {Languages} from "../Languages";


function HomeScreen({navigation}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity onPress={() => {
        core.eventBus.emit("showLoading","Test");
        setTimeout(() => { core.eventBus.emit("hideLoading")}, 1000)
      }}><Text>Home Screen</Text>
      </TouchableOpacity>
    </View>
  );
}

function NotLoggedInScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>NotLoggedInScreen Screen</Text>
    </View>
  );
}

function ModalsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>ModalsScreen Screen</Text>
    </View>
  );
}

function OverlaysScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>OverlaysScreen Screen</Text>
    </View>
  );
}


const SubStack  = createNativeStackNavigator();
const Stack  = createNativeStackNavigator();
const Tab    = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

export class App extends Component<any, any> {

  constructor(props) {
    super(props);

    // initialize the views to tell android lib we are starting the UI.
    Bluenet.viewsInitialized();

    this.state = { initialized: false, loggedIn: false, permissionsAsked: false };
  }

  setAppState = (loggedIn: boolean, permissionsAsked: boolean) => {
    this.setState({initialized: true, loggedIn: loggedIn, permissionsAsked: permissionsAsked});
  }

  render() {
    if (!this.state.initialized) {
      return <Initializer setAppState={this.setAppState} />;
    }
    else {
      return (
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator>
            {/* Pre-login */}
            { this.state.initialized && !this.state.loggedIn && NotLoggedIn(this.setAppState) }

            {/* Permissions */}
            { this.state.initialized && !this.state.permissionsAsked && Permissions(this.setAppState) }

            {/* Tabgroups */}
            { this.state.initialized && this.state.permissionsAsked && LoggedIn(this.setAppState) }

            {/*Overlays*/}
            { Overlays() }
          </Stack.Navigator>
        </NavigationContainer>
      )
    }
  }
}

function NotLoggedIn(setAppState) {
  return (
    <Stack.Group screenOptions={{headerShown:false}}>
      <Stack.Screen name="LoginSplash" component={LoginSplash} />
      <Stack.Screen name="Register"    component={Register} />
      <Stack.Screen name="Login">{ props => <Login {...props} setAppState={setAppState} />}</Stack.Screen>
    </Stack.Group>
  );
}

function Permissions(setAppState) {
  return (
    <Stack.Screen name="Permissions" options={{headerShown: false}}>
      { props => <PermissionIntroduction {...props} setAppState={setAppState} />}
    </Stack.Screen>
  );
}

function LoggedIn(setAppState) {
  return (
    <React.Fragment>
      <Stack.Screen name="TabNavigator" options={{headerShown: false}}>
        { props => <TabNavigator {...props} setAppState={setAppState} />}
      </Stack.Screen>
      { Modals() }
    </React.Fragment>
  );
}

function TabNavigator(props) {
  return (
    <Tab.Navigator
      screenOptions={{headerShown:false, tabBarActiveTintColor: colors.blue.hex, tabBarInactiveTintColor: colors.csBlue.hex}}>
      <Tab.Screen name="SphereOverviewTab"
                  options={{
                    tabBarStyle:{position:"absolute", backgroundColor:'transparent', borderTopColor: 'transparent'},
                    tabBarLabel: Languages.get("Tabs","Overview")(),
                    tabBarIcon: ({focused, color, size}) => { return <Image source={require('../../assets/images/icons/house.png')} style={{tintColor:color}} /> }
                  }}
      >
        {tabBarProps => { tabBarNavigationContainer.navigator = tabBarProps.navigation; return <SphereOverviewTab {...tabBarProps} /> }}
      </Tab.Screen>
      <Tab.Screen name="ScenesTab"
                  component={ScenesTab}
                  options={{
                    tabBarLabel: Languages.get("Tabs","Scenes")(),
                    tabBarIcon: ({focused, color, size}) => { return <Image source={require('../../assets/images/icons/scenes.png')} style={{tintColor:color}} /> }
                  }}/>
      <Tab.Screen name="MessagesTab"
                  component={MessagesTab}
                  options={{
                    tabBarLabel: Languages.get("Tabs","Messages")(),
                    tabBarIcon: ({focused, color, size}) => { return <Image source={require('../../assets/images/icons/mail.png')} style={{tintColor:color}} /> }
                  }}/>
      <Tab.Screen name="SettingsTab"
                  component={SettingsTab}
                  options={{
                    tabBarLabel: Languages.get("Tabs","Settings")(),
                    tabBarIcon: ({focused, color, size}) => { return <Image source={require('../../assets/images/icons/cog.png')} style={{tintColor:color}} /> }
                  }}/>
    </Tab.Navigator>
  );
}

function SphereOverviewTab(props) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DrawerNavigator" options={{headerShown: false}}>
        { props => <SphereOverviewDrawer {...props} />}
      </Stack.Screen>
      <Stack.Screen name="RoomOverview" component={RoomOverview} />
    </Stack.Navigator>
  )
}

function SphereOverviewDrawer(props) {
  return (
    <Drawer.Navigator
      initialRouteName="SphereOverview"
      drawerContent={(props) => <SphereOverviewSideBar {...props} />}
      screenOptions={{swipeEnabled:false, overlayColor:'transparent'}}
    >
      <Drawer.Screen name="SphereOverview" options={{headerShown: false}}>
        { drawerProps => { drawerNavigationContainer.navigator = drawerProps.navigation; return <SphereOverview {...drawerProps} /> }}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function SettingsTab(props) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsOverview" component={SettingsOverview} />
    </Stack.Navigator>
  )
}
function ScenesTab(props) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ScenesOverview" component={ScenesOverview} />
    </Stack.Navigator>
  )
}
function MessagesTab(props) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MessageInbox" component={MessageInbox} />
    </Stack.Navigator>
  )
}

function Modals() {
  return (
    <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
      <Stack.Screen name="Modals" component={ModalsScreen} />
    </Stack.Group>
  );
}

function Overlays() {
  return (
    <Stack.Group screenOptions={{
      presentation: 'transparentModal',
      headerShown:false,
      animation: 'fade'
    }}
    >
      <Stack.Screen name="AicoreTimeCustomizationOverlay" component={AicoreTimeCustomizationOverlay} />
      <Stack.Screen name="BleStateOverlay"                component={BleStateOverlay} />
      <Stack.Screen name="DimLevelOverlay"                component={DimLevelOverlay} />
      <Stack.Screen name="ErrorOverlay"                   component={ErrorOverlay} />
      <Stack.Screen name="LibMessages"                    component={LibMessages} />
      <Stack.Screen name="ListOverlay"                    component={ListOverlay} />
      <Stack.Screen name="LocalizationSetupStep1"         component={LocalizationSetupStep1} />
      <Stack.Screen name="LocalizationSetupStep2"         component={LocalizationSetupStep2} />
      <Stack.Screen name="LocationPermissionOverlay"      component={LocationPermissionOverlay} />
      <Stack.Screen name="LockOverlay"                    component={LockOverlay} />
      <Stack.Screen name="NumericOverlay"                 component={NumericOverlay} />
      <Stack.Screen name="OptionPopup"                    component={OptionPopup} />
      <Stack.Screen name="Processing"                     component={Processing} />
      <Stack.Screen name="SimpleOverlay"                  component={SimpleOverlay} />
      <Stack.Screen name="TextInputOverlay"               component={TextInputOverlay} />
    </Stack.Group>
  );
}

