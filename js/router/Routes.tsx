import * as React from 'react';
import {
  createStackNavigator,
  createBottomTabNavigator,
  createSwitchNavigator,
  HeaderMode
} from "react-navigation";
import { TextStyle }          from "react-native";
import { Provider, connect }  from 'react-redux';
import { TabIcon }            from "./TabIcon";
import { Languages }          from "../Languages";
import { Initializer }        from "./Initializer";
import { colors}              from '../views/styles'
import { Views }              from './Views'


interface headerModeObj {
  headerMode: HeaderMode
}
const defaultMode : headerModeObj = {
  headerMode: 'float',
}
const hiddenHeaderMode : headerModeObj = {
  headerMode: 'none',
}

interface defaultHeaderStyle {
  headerStyle: any,
  headerTitleStyle : TextStyle,
  headerBackTitleStyle : TextStyle,
  headerTintColor: string,
}
const defaultHeaderStyle : defaultHeaderStyle = {
  headerStyle: {
    backgroundColor: colors.menuBackground.hex,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerBackTitleStyle: {
    fontSize:14,
    fontWeight: 'bold',
  }
}
const defaultHeader = {
  ...defaultMode,
  defaultNavigationOptions: {
    ...defaultHeaderStyle
  },
}
const defaultBackButtonHeaderStyle = {
  ...defaultMode,
  defaultNavigationOptions: {
    ...defaultHeaderStyle,
  }
}


const NewBehaviourStack = createStackNavigator(
  {
    DeviceSmartBehaviour :                    Views.DeviceSmartBehaviour,
    DeviceSmartBehaviour_Editor :             Views.DeviceSmartBehaviour_Editor,
    DeviceSmartBehaviour_TypeSelector :       Views.DeviceSmartBehaviour_TypeSelector,
    DeviceSmartBehaviour_TypeStart :          Views.DeviceSmartBehaviour_TypeStart,
  },
  {
    ...defaultHeader
  }
);


const EditSphereStack = createStackNavigator(
  {
    SphereEdit               : Views.SphereEdit,
    SphereEditSettings       : Views.SphereEditSettings,
    SphereRoomOverview       : Views.SphereRoomOverview,
    SphereCrownstoneOverview : Views.SphereCrownstoneOverview,
    SphereRoomArranger       : Views.SphereRoomArranger,
    SphereUserOverview       : Views.SphereUserOverview,
    SphereInvitedUser        : Views.SphereInvitedUser,
    SphereUser               : Views.SphereUser,
    SphereBehaviour          : Views.SphereBehaviour,
    SphereIntegrations       : Views.SphereIntegrations,
    AlexaOverview            : Views.AlexaOverview,
    ToonOverview             : Views.ToonOverview,
    ToonSettings             : Views.ToonSettings,
  },
  {
    ...defaultBackButtonHeaderStyle
  }
);

const MainStack = createStackNavigator(
  {
    SphereOverview: Views.SphereOverview,
    DeviceOverview: Views.DeviceOverview,
    RoomOverview:   Views.RoomOverview,
  },
  {
    ...defaultHeader
  }
);

const MessageStack = createStackNavigator(
  {
    MessageInbox: Views.MessageInbox,
  },
  {
    ...defaultHeader
  }
);
const SettingsStack = createStackNavigator(
  {
    SettingsOverview:      Views.SettingsOverview,
    SettingsDiagnostics:   Views.SettingsDiagnostics,
    SettingsProfile:       Views.SettingsProfile,
    SettingsPrivacy:       Views.SettingsPrivacy,
    SettingsApp:           Views.SettingsApp,
    SettingsMeshOverview:  Views.SettingsMeshOverview,
    SettingsStoneBleDebug: Views.SettingsStoneBleDebug,
    SettingsMeshTopology:  Views.SettingsMeshTopology,
    SettingsLogging:       Views.SettingsLogging,
    SettingsBleDebug:      Views.SettingsBleDebug,
    SettingsMeshDebug:     Views.SettingsMeshDebug,
    SettingsDeveloper:     Views.SettingsDeveloper,
    SettingsFAQ:           Views.SettingsFAQ,
    SettingsLocalizationDebug:  Views.SettingsLocalizationDebug,
    SettingsBleTroubleshooting: Views.SettingsBleTroubleshooting,
  },
  {
    ...defaultHeader
  }
);

const TabNavigator = createBottomTabNavigator(
  {
    Main:           MainStack,
    Messages:       MessageStack,
    Settings:       SettingsStack,
  },
  {
    // initialRouteName: "__proto",
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let name = "";
        let icon = "";
        let badgeOnMessages = false;
        switch (routeName) {
          case "__proto":
            name = "Prototype";
            icon = "md-aperture";
            break;
          case "Main":
            name = Languages.get("Tabs","Overview")();
            icon = "ios-color-filter-outline";
            break;
          case "Messages":
            name = Languages.get("Tabs","Messages")();
            icon = "ios-mail";
            badgeOnMessages = true;
            break;
          case "Settings":
            name = Languages.get("Tabs","Settings")();
            icon = "ios-cog";
            break;
        }
        return <TabIcon iconString={icon} focused={focused} tabTitle={name} badgeOnMessages={badgeOnMessages} />
      },
    }),
    tabBarOptions: {
      activeBackgroundColor: colors.menuBackground.hex,
      inactiveBackgroundColor: colors.menuBackground.hex,
      activeTintColor: colors.menuTextSelected.hex,
      inactiveTintColor: colors.white.hex,
      showLabel: false
    },
  }
);



const InitialStack = createStackNavigator(
  {
    LoginSplash:        Views.LoginSplash,
    Login:              Views.Login,
    Logout:             Views.Logout,
    Register:           Views.Register,
    RegisterConclusion: Views.RegisterConclusion,
    Tutorial:           Views.Tutorial,
  },
  {
    ...defaultHeader
  }
);


const RoomTrainingStack = createStackNavigator(
  {
    RoomTraining_roomSize:     Views.RoomTraining_roomSize,
    RoomTraining:              Views.RoomTraining,
  },
  {
    ...defaultHeader
  }
);

const FactoryResetStack = createStackNavigator(
  {
    SettingsFactoryResetStep1:     Views.SettingsFactoryResetStep1,
    SettingsFactoryResetStep2:     Views.SettingsFactoryResetStep2,

  },
  {
    ...defaultHeader
  }
);


const AppStack = createStackNavigator(
  {
    // test: {
    //   screen: wrap("InterviewLight", InterviewLight),
    // },
    AppNavigator: {
      screen: TabNavigator,
    },
    StoneBehaviour: {
      screen: NewBehaviourStack,
    },
    //modals:
    AddItemsToSphere: {
      screen: wrap("AddItemsToSphere", Views.AddItemsToSphere),
    },
    AddSphereTutorial: {
      screen:  wrap("AddSphereTutorial", Views.AddSphereTutorial),
    },
    AiStart: {
      screen: wrap("AiStart", Views.AiStart),
    },
    ApplianceSelection: {
      screen: wrap("ApplianceSelection", Views.ApplianceSelection),
    },
    ApplianceAdd: {
      screen: wrap("ApplianceAdd", Views.ApplianceAdd),
    },
    CameraRollView: {
      screen:  wrap("CameraRollView", Views.CameraRollView),
    },
    DeviceEdit: {
      screen:  wrap("DeviceEdit", Views.DeviceEdit),
    },
    DeviceBehaviourEdit: {
      screen:  wrap("DeviceBehaviourEdit", Views.DeviceBehaviourEdit),
    },
    DeviceIconSelection: {
      screen:  wrap("DeviceIconSelection", Views.DeviceIconSelection),
    },
    DeviceScheduleEdit: {
      screen:  wrap("DeviceScheduleEdit", Views.DeviceScheduleEdit),
    },
    EditSphereMenu: {
      screen: EditSphereStack
    },
    FactoryResetStack: {
      screen: FactoryResetStack,
    },
    MessageAdd: {
      screen:  wrap("MessageAdd", Views.MessageAdd),
    },
    PictureView: {
      screen:  wrap("PictureView", Views.PictureView),
    },
    RoomTrainingStack: {
      screen: RoomTrainingStack,
    },
    RoomSelection: {
      screen:  wrap("RoomSelection", Views.RoomSelection),
    },
    RoomIconSelection: {
      screen:  wrap("RoomIconSelection", Views.RoomIconSelection),
    },
    RoomAdd: {
      screen:  wrap("RoomAdd", Views.RoomAdd),
    },
    RoomEdit: {
      screen: wrap("RoomEdit", Views.RoomEdit),
    },
    SettingsMeshTopologyHelp: {
      screen: wrap("SelectFromList", Views.SettingsMeshTopologyHelp),
    },
    SelectFromList: {
      screen: wrap("SelectFromList", Views.SelectFromList),
    },
    SettingsRedownloadFromCloud: {
      screen: wrap("SettingsRedownloadFromCloud", Views.SettingsRedownloadFromCloud),
    },
    SphereUserInvite: {
      screen:  wrap("SphereUserInvite", Views.SphereUserInvite),
    },
    SwitchCraftInformation: {
      screen:  wrap("SwitchCraftInformation", Views.SwitchCraftInformation),
    },
    ToonAdd: {
      screen:  wrap("ToonAdd", Views.ToonAdd),
    },
  },
  {
    // initialRouteName: "AppNavigator",
    mode: 'modal',
    headerMode: 'none',
  }
);

export const RootStack = createSwitchNavigator(
  {
    // IconDebug: {
    //   screen: Views.IconDebug,
    // },
    Splash: {
      screen: Initializer,
    },
    NewUser: {
      screen: InitialStack,
    },
    AppBase: {
      screen: AppStack
    },
    Logout: {
      screen: wrap("Logout", Views.Logout),
    },
  },
  {
    initialRouteName: "Splash",
    ...hiddenHeaderMode,
  }
)


/**
 * this is a convenience method that will create a new stack navigator for each modal so that it has a header.
 * @param view
 */
function wrap(view, ViewElement) {
  let obj = {};
  obj[view] = {
    screen: ViewElement,
  }
  return createStackNavigator(
    obj,
    {
      ...defaultHeader,
      navigationOptions: {gesturesEnabled: false},
    }
  )
}