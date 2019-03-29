import { withMappedNavigationProps } from 'react-navigation-props-mapper'

import { AddSphereTutorial }           from "../views/main/addSphereTutorial/AddSphereTutorial";
import { AlexaOverview }               from "../views/thirdParty/alexa/AlexaOverview";

import { AiStart }                     from '../views/startupViews/AiStart'
import { ApplianceSelection }          from '../views/deviceViews/ApplianceSelection'
import { ApplianceAdd }                from '../views/deviceViews/ApplianceAdd'
import { AddItemsToSphere }            from '../views/main/AddItemsToSphere'
import { CameraRollView }              from '../views/cameraViews/CameraRollView'
import { DeviceOverview }              from '../views/deviceViews/DeviceOverview'
import { DeviceEdit }                  from '../views/deviceViews/DeviceEdit'
import { DeviceBehaviourEdit }         from '../views/deviceViews/DeviceBehaviourEdit'
import { DeviceScheduleEdit }          from '../views/deviceViews/DeviceScheduleEdit'
import { DeviceIconSelection }         from '../views/deviceViews/DeviceIconSelection'
import { LoginSplash }                 from '../views/startupViews/LoginSplash'
import { Login }                       from '../views/startupViews/Login'
import { Logout }                      from "../views/startupViews/Logout";
import { MessageInbox }                from '../views/messaging/MessageInbox'
import { MessageAdd }                  from '../views/messaging/MessageAdd'
import { PictureView }                 from '../views/cameraViews/PictureView'
import { Register }                    from '../views/startupViews/Register'
import { RegisterConclusion }          from '../views/startupViews/RegisterConclusion'
import { RoomOverview }                from '../views/roomViews/RoomOverview'
import { RoomEdit }                    from '../views/roomViews/RoomEdit'
import { RoomAdd }                     from '../views/roomViews/RoomAdd'
import { RoomTraining }                from '../views/roomViews/RoomTraining'
import { RoomTraining_roomSize }       from '../views/roomViews/RoomTraining_roomSize'
import { RoomSelection }               from '../views/roomViews/RoomSelection'
import { RoomIconSelection }           from '../views/roomViews/RoomIconSelection'
import { SphereOverview }              from '../views/main/SphereOverview'
import { SelectFromList }              from '../views/selection/SelectFromList'
import { SphereEdit }                  from '../views/main/SphereEdit'
import { SphereEditSettings }          from '../views/main/editSubviews/SphereEditSettings'
import { SphereRoomOverview }          from "../views/main/editSubviews/SphereRoomOverview";
import { SphereCrownstoneOverview }    from "../views/main/editSubviews/SphereCrownstoneOverview";
import { SphereRoomArranger }          from "../views/main/editSubviews/SphereRoomArranger";
import { SphereUserInvite }            from "../views/main/editSubviews/SphereUserInvite";
import { SphereUserOverview }          from "../views/main/editSubviews/SphereUserOverview";
import { SphereInvitedUser }           from "../views/main/editSubviews/SphereInvitedUser";
import { SphereUser }                  from "../views/main/editSubviews/SphereUser";
import { SphereBehaviour }             from "../views/main/editSubviews/SphereBehaviour";
import { SphereIntegrations }          from "../views/main/editSubviews/SphereIntegrations";

import { SettingsApp }                 from '../views/settingsViews/SettingsApp'
import { SettingsBleDebug }            from '../views/settingsViews/dev/SettingsBleDebug'
import { SettingsDeveloper }           from '../views/settingsViews/SettingsDeveloper'
import { SettingsDiagnostics }         from '../views/settingsViews/SettingsDiagnostics'
import { SettingsFactoryResetStep1 }   from '../views/settingsViews/SettingsFactoryResetStep1'
import { SettingsFactoryResetStep2 }   from '../views/settingsViews/SettingsFactoryResetStep2'
import { SettingsFAQ }                 from "../views/settingsViews/SettingsFAQ";
import { SettingsLocalizationDebug }   from '../views/settingsViews/dev/SettingsLocalizationDebug'
import { SettingsLogging }             from "../views/settingsViews/dev/SettingsLogging";
import { SettingsMeshDebug }           from "../views/settingsViews/dev/SettingsMeshDebug";
import { SettingsMeshOverview }        from '../views/settingsViews/SettingsMeshOverview'
import { SettingsMeshTopology}         from '../views/settingsViews/SettingsMeshTopology'
import { SettingsMeshTopologyHelp }    from "../views/settingsViews/SettingsMeshTopologyHelp";
import { SettingsOverview }            from '../views/settingsViews/SettingsOverview'
import { SettingsProfile }             from '../views/settingsViews/SettingsProfile'
import { SettingsPrivacy }             from '../views/settingsViews/SettingsPrivacy'
import { SettingsRedownloadFromCloud } from '../views/settingsViews/SettingsRedownloadFromCloud'
import { SettingsStoneBleDebug }       from '../views/settingsViews/dev/SettingsStoneBleDebug'
import { SettingsBleTroubleshooting }  from '../views/settingsViews/SettingsBleTroubleshooting'

import { Tutorial }                    from "../views/tutorialViews/Tutorial";
import { IconDebug }                   from "../views/development/IconDebug";
import { SwitchCraftInformation }      from "../views/deviceViews/elements/SwitchCraftInformation";

import { ToonAdd }                     from "../views/thirdParty/toon/ToonAdd";
import { ToonSettings }                from "../views/thirdParty/toon/ToonSettings";
import { ToonOverview }                from "../views/thirdParty/toon/ToonOverview";
import { DeviceSmartBehaviour } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour";
import { DeviceSmartBehaviour2 } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour2";
import { DeviceSmartBehaviour_TypeSelector } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_TypeSelector";
import { DeviceSmartBehaviour_TypeStart }   from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_TypeStart";
import { DeviceSmartBehaviour_CreateNewBehaviour } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_CreateNewBehaviour";
import { DeviceSmartBehaviour_PresenceAware } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_PresenceAware";
import { DeviceSmartBehaviour_Editor } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_Editor";

export const Views = {
  AddItemsToSphere:               withMappedNavigationProps()(AddItemsToSphere),
  AddSphereTutorial:              withMappedNavigationProps()(AddSphereTutorial),
  AiStart:                        withMappedNavigationProps()(AiStart),
  AlexaOverview:                  withMappedNavigationProps()(AlexaOverview),
  ApplianceAdd:                   withMappedNavigationProps()(ApplianceAdd),
  ApplianceSelection:             withMappedNavigationProps()(ApplianceSelection),
  CameraRollView:                 withMappedNavigationProps()(CameraRollView),
  DeviceBehaviourEdit:            withMappedNavigationProps()(DeviceBehaviourEdit),
  DeviceEdit:                     withMappedNavigationProps()(DeviceEdit),
  DeviceIconSelection:            withMappedNavigationProps()(DeviceIconSelection),
  DeviceOverview:                 withMappedNavigationProps()(DeviceOverview),
  DeviceScheduleEdit:             withMappedNavigationProps()(DeviceScheduleEdit),
  DeviceSmartBehaviour:           withMappedNavigationProps()(DeviceSmartBehaviour),
  DeviceSmartBehaviour2:          withMappedNavigationProps()(DeviceSmartBehaviour2),
  DeviceSmartBehaviour_CreateNewBehaviour: withMappedNavigationProps()(DeviceSmartBehaviour_CreateNewBehaviour),
  DeviceSmartBehaviour_Editor:             withMappedNavigationProps()(DeviceSmartBehaviour_Editor),
  DeviceSmartBehaviour_PresenceAware:      withMappedNavigationProps()(DeviceSmartBehaviour_PresenceAware),
  DeviceSmartBehaviour_TypeSelector:       withMappedNavigationProps()(DeviceSmartBehaviour_TypeSelector),
  DeviceSmartBehaviour_TypeStart:          withMappedNavigationProps()(DeviceSmartBehaviour_TypeStart),
  IconDebug:                      withMappedNavigationProps()(IconDebug),
  Login:                          withMappedNavigationProps()(Login),
  LoginSplash:                    withMappedNavigationProps()(LoginSplash),
  Logout:                         withMappedNavigationProps()(Logout),
  MessageAdd:                     withMappedNavigationProps()(MessageAdd),
  MessageInbox:                   withMappedNavigationProps()(MessageInbox),
  PictureView:                    withMappedNavigationProps()(PictureView),
  Register:                       withMappedNavigationProps()(Register),
  RegisterConclusion:             withMappedNavigationProps()(RegisterConclusion),
  RoomAdd:                        withMappedNavigationProps()(RoomAdd),
  RoomEdit:                       withMappedNavigationProps()(RoomEdit),
  RoomIconSelection:              withMappedNavigationProps()(RoomIconSelection),
  RoomOverview:                   withMappedNavigationProps()(RoomOverview),
  RoomSelection:                  withMappedNavigationProps()(RoomSelection),
  RoomTraining:                   withMappedNavigationProps()(RoomTraining),
  RoomTraining_roomSize:          withMappedNavigationProps()(RoomTraining_roomSize),
  SelectFromList:                 withMappedNavigationProps()(SelectFromList),
  SettingsApp:                    withMappedNavigationProps()(SettingsApp),
  SettingsBleDebug:               withMappedNavigationProps()(SettingsBleDebug),
  SettingsBleTroubleshooting:     withMappedNavigationProps()(SettingsBleTroubleshooting),
  SettingsDeveloper:              withMappedNavigationProps()(SettingsDeveloper),
  SettingsDiagnostics:            withMappedNavigationProps()(SettingsDiagnostics),
  SettingsFAQ:                    withMappedNavigationProps()(SettingsFAQ),
  SettingsFactoryResetStep1:      withMappedNavigationProps()(SettingsFactoryResetStep1),
  SettingsFactoryResetStep2:      withMappedNavigationProps()(SettingsFactoryResetStep2),
  SettingsLocalizationDebug:      withMappedNavigationProps()(SettingsLocalizationDebug),
  SettingsLogging:                withMappedNavigationProps()(SettingsLogging),
  SettingsMeshDebug:              withMappedNavigationProps()(SettingsMeshDebug),
  SettingsMeshOverview:           withMappedNavigationProps()(SettingsMeshOverview),
  SettingsMeshTopology:           withMappedNavigationProps()(SettingsMeshTopology),
  SettingsMeshTopologyHelp:       withMappedNavigationProps()(SettingsMeshTopologyHelp),
  SettingsOverview:               withMappedNavigationProps()(SettingsOverview),
  SettingsPrivacy:                withMappedNavigationProps()(SettingsPrivacy),
  SettingsProfile:                withMappedNavigationProps()(SettingsProfile),
  SettingsRedownloadFromCloud:    withMappedNavigationProps()(SettingsRedownloadFromCloud),
  SettingsStoneBleDebug:          withMappedNavigationProps()(SettingsStoneBleDebug),
  SphereBehaviour:                withMappedNavigationProps()(SphereBehaviour),
  SphereCrownstoneOverview:       withMappedNavigationProps()(SphereCrownstoneOverview),
  SphereEdit:                     withMappedNavigationProps()(SphereEdit),
  SphereEditSettings:             withMappedNavigationProps()(SphereEditSettings),
  SphereIntegrations:             withMappedNavigationProps()(SphereIntegrations),
  SphereInvitedUser:              withMappedNavigationProps()(SphereInvitedUser),
  SphereOverview:                 withMappedNavigationProps()(SphereOverview),
  SphereRoomArranger:             withMappedNavigationProps()(SphereRoomArranger),
  SphereRoomOverview:             withMappedNavigationProps()(SphereRoomOverview),
  SphereUser:                     withMappedNavigationProps()(SphereUser),
  SphereUserInvite:               withMappedNavigationProps()(SphereUserInvite),
  SphereUserOverview:             withMappedNavigationProps()(SphereUserOverview),
  SwitchCraftInformation:         withMappedNavigationProps()(SwitchCraftInformation),
  ToonAdd:                        withMappedNavigationProps()(ToonAdd),
  ToonOverview:                   withMappedNavigationProps()(ToonOverview),
  ToonSettings:                   withMappedNavigationProps()(ToonSettings),
  Tutorial:                       withMappedNavigationProps()(Tutorial),
};