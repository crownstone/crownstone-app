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

import { Tutorial }                    from "../views/tutorialViews/Tutorial";
import { IconDebug }                   from "../views/development/IconDebug";
import { SwitchCraftInformation }      from "../views/deviceViews/elements/SwitchCraftInformation";

import { ToonAdd }                     from "../views/thirdParty/toon/ToonAdd";
import { ToonSettings }                from "../views/thirdParty/toon/ToonSettings";
import { ToonOverview }                from "../views/thirdParty/toon/ToonOverview";

export const Views = {
  AddItemsToSphere,
  AiStart,
  SelectFromList,
  LoginSplash,
  Login,
  Logout,
  Register,
  RegisterConclusion,
  PictureView,
  CameraRollView,
  SphereOverview,
  SphereEdit,
  SphereEditSettings,
  SphereRoomOverview,
  SphereCrownstoneOverview,
  SphereRoomArranger,
  SphereUserInvite,
  SphereUserOverview,
  SphereInvitedUser,
  SphereUser,
  SphereBehaviour,
  SphereIntegrations,

  ToonAdd,
  ToonSettings,
  ToonOverview,

  RoomOverview,
  RoomEdit,
  RoomAdd,
  RoomSelection,
  RoomIconSelection,
  RoomTraining,
  RoomTraining_roomSize,
  ApplianceSelection,
  ApplianceAdd,
  DeviceOverview,
  DeviceEdit,
  DeviceBehaviourEdit,
  DeviceIconSelection,
  DeviceScheduleEdit,
  MessageInbox,
  MessageAdd,
  SettingsApp,
  SettingsOverview,
  SettingsDiagnostics,
  SettingsProfile,
  SettingsPrivacy,
  SettingsBleDebug,
  SettingsLogging,
  SettingsMeshDebug,
  SettingsLocalizationDebug,
  SettingsStoneBleDebug,
  SettingsDeveloper,
  SettingsFAQ,
  SettingsMeshOverview,
  SettingsMeshTopology,
  SettingsMeshTopologyHelp,
  SettingsRedownloadFromCloud,
  SettingsFactoryResetStep1,
  SettingsFactoryResetStep2,
  SwitchCraftInformation,
  Tutorial,
  IconDebug,
};