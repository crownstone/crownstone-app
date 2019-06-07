
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Views", key)(a,b,c,d,e);
}
import * as React from 'react';
// import { withMappedNavigationProps } from 'react-navigation-props-mapper'

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
import { RoomOverview }                from '../views/roomViews/RoomOverview'
import { RoomEdit }                    from '../views/roomViews/RoomEdit'
import { RoomAdd }                     from '../views/roomViews/RoomAdd'
import { RoomTraining }                from '../views/roomViews/RoomTraining'
import { RoomTraining_roomSize }       from '../views/roomViews/RoomTraining_roomSize'
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
import { DeviceSmartBehaviour }        from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour";
import { DeviceSmartBehaviour_TypeSelector } from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_TypeSelector";
import { DeviceSmartBehaviour_Editor }       from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_Editor";
import { DeviceSmartBehaviour_TypeStart }    from "../views/deviceViews/elements/smartBehaviour/DeviceSmartBehaviour_TypeStart";
import { AddCrownstone }               from "../views/addingCrownstones/AddCrownstone";
import { ScanningForSetupCrownstones } from "../views/addingCrownstones/ScanningForSetupCrownstones";
import { SetupCrownstone }             from "../views/addingCrownstones/SetupCrownstone";
import { DfuIntroduction }             from "../views/dfu/DfuIntroduction";
import { DfuScanning }                 from "../views/dfu/DfuScanning";
import { DfuBatch }                    from "../views/dfu/DfuBatch";
import { DfuFinished } from "../views/dfu/DfuFinished";
import { Initializer } from "./Initializer";
import { Processing } from "../views/overlays/Processing";
import { AicoreTimeCustomizationOverlay } from "../views/overlays/AicoreTimeCustomizationOverlay";
import { BleStateOverlay } from "../views/overlays/BleStateOverlay";
import { ErrorOverlay } from "../views/overlays/ErrorOverlay";
import { LibMessages } from "../views/overlays/LibMessages";
import { ListOverlay } from "../views/overlays/ListOverlay";
import { LocalizationSetupStep1 } from "../views/overlays/LocalizationSetupStep1";
import { LocalizationSetupStep2 } from "../views/overlays/LocalizationSetupStep2";
import { LocationPermissionOverlay } from "../views/overlays/LocationPermissionOverlay";
import { LockOverlay } from "../views/overlays/LockOverlay";
import { SimpleOverlay } from "../views/overlays/SimpleOverlay";
import { TapToToggleCalibration } from "../views/overlays/TapToToggleCalibration";
import { OptionPopup } from "../views/overlays/OptionPopup";
import { DeviceOverviewProto } from "../views/deviceViews/DeviceOverviewProto";


export const Views = {
  Initializer:                       Initializer,

  AddCrownstone:                     AddCrownstone,
  SetupCrownstone:                   SetupCrownstone,
  ScanningForSetupCrownstones:       ScanningForSetupCrownstones,

  DfuIntroduction:                   DfuIntroduction,
  DfuScanning:                       DfuScanning,
  DfuBatch:                          DfuBatch,
  DfuFinished:                       DfuFinished,

  AddItemsToSphere:                  AddItemsToSphere,
  AddSphereTutorial:                 AddSphereTutorial,
  AiStart:                           AiStart,
  AlexaOverview:                     AlexaOverview,
  ApplianceAdd:                      ApplianceAdd,
  ApplianceSelection:                ApplianceSelection,
  CameraRollView:                    CameraRollView,
  DeviceBehaviourEdit:               DeviceBehaviourEdit,
  DeviceEdit:                        DeviceEdit,
  DeviceIconSelection:               DeviceIconSelection,
  DeviceOverview:                    DeviceOverview,
  DeviceOverviewProto:               DeviceOverviewProto,
  DeviceScheduleEdit:                DeviceScheduleEdit,
  DeviceSmartBehaviour:              DeviceSmartBehaviour,
  DeviceSmartBehaviour_Editor:       DeviceSmartBehaviour_Editor,
  DeviceSmartBehaviour_TypeSelector: DeviceSmartBehaviour_TypeSelector,
  DeviceSmartBehaviour_TypeStart:    DeviceSmartBehaviour_TypeStart,
  IconDebug:                         IconDebug,
  Login:                             Login,
  LoginSplash:                       LoginSplash,
  Logout:                            Logout,
  MessageAdd:                        MessageAdd,
  MessageInbox:                      MessageInbox,
  PictureView:                       PictureView,
  Register:                          Register,
  RoomAdd:                           RoomAdd,
  RoomEdit:                          RoomEdit,
  RoomIconSelection:                 RoomIconSelection,
  RoomOverview:                      RoomOverview,
  RoomTraining:                      RoomTraining,
  RoomTraining_roomSize:             RoomTraining_roomSize,
  SelectFromList:                    SelectFromList,
  SettingsApp:                       SettingsApp,
  SettingsBleDebug:                  SettingsBleDebug,
  SettingsBleTroubleshooting:        SettingsBleTroubleshooting,
  SettingsDeveloper:                 SettingsDeveloper,
  SettingsDiagnostics:               SettingsDiagnostics,
  SettingsFAQ:                       SettingsFAQ,
  SettingsFactoryResetStep1:         SettingsFactoryResetStep1,
  SettingsFactoryResetStep2:         SettingsFactoryResetStep2,
  SettingsLocalizationDebug:         SettingsLocalizationDebug,
  SettingsLogging:                   SettingsLogging,
  SettingsMeshDebug:                 SettingsMeshDebug,
  SettingsMeshOverview:              SettingsMeshOverview,
  SettingsMeshTopology:              SettingsMeshTopology,
  SettingsMeshTopologyHelp:          SettingsMeshTopologyHelp,
  SettingsOverview:                  SettingsOverview,
  SettingsPrivacy:                   SettingsPrivacy,
  SettingsProfile:                   SettingsProfile,
  SettingsRedownloadFromCloud:       SettingsRedownloadFromCloud,
  SettingsStoneBleDebug:             SettingsStoneBleDebug,
  SphereBehaviour:                   SphereBehaviour,
  SphereCrownstoneOverview:          SphereCrownstoneOverview,
  SphereEdit:                        SphereEdit,
  SphereEditSettings:                SphereEditSettings,
  SphereIntegrations:                SphereIntegrations,
  SphereInvitedUser:                 SphereInvitedUser,
  SphereOverview:                    SphereOverview,
  SphereRoomArranger:                SphereRoomArranger,
  SphereRoomOverview:                SphereRoomOverview,
  SphereUser:                        SphereUser,
  SphereUserInvite:                  SphereUserInvite,
  SphereUserOverview:                SphereUserOverview,
  SwitchCraftInformation:            SwitchCraftInformation,
  ToonAdd:                           ToonAdd,
  ToonOverview:                      ToonOverview,
  ToonSettings:                      ToonSettings,
  Tutorial:                          Tutorial,


  // Overlays:

  AicoreTimeCustomizationOverlay:   AicoreTimeCustomizationOverlay,
  BleStateOverlay:                  BleStateOverlay,
  ErrorOverlay:                     ErrorOverlay,
  LibMessages:                      LibMessages,
  ListOverlay:                      ListOverlay,
  LocalizationSetupStep1:           LocalizationSetupStep1,
  LocalizationSetupStep2:           LocalizationSetupStep2,
  LocationPermissionOverlay:        LocationPermissionOverlay,
  LockOverlay:                      LockOverlay,
  OptionPopup:                      OptionPopup,
  Processing:                       Processing,
  SimpleOverlay:                    SimpleOverlay,
  TapToToggleCalibration:           TapToToggleCalibration,
};