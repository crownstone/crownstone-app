
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Views", key)(a,b,c,d,e);
}
import * as React from 'react';

import { AddSphereTutorial }                  from "../views/main/addSphereTutorial/AddSphereTutorial";
import { AlexaOverview }                      from "../views/thirdParty/alexa/AlexaOverview";

import { AiStart }                            from '../views/startupViews/AiStart'
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
import { SphereBehaviour }                    from "../views/main/editSubviews/SphereBehaviour";
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
import { RoomOverview2 } from "./roomViews/RoomOverview2";


export const Views = {
  Initializer:                       Initializer,

  AddCrownstone:                     AddCrownstone,
  SetupCrownstone:                   SetupCrownstone,
  SetupHub:                          SetupHub,
  ScanningForSetupCrownstones:       ScanningForSetupCrownstones,

  DfuIntroduction:                   DfuIntroduction,
  DfuScanning:                       DfuScanning,
  DfuBatch:                          DfuBatch,
  DfuFinished:                       DfuFinished,

  PermissionIntroduction:            PermissionIntroduction,

  AddItemsToSphere:                  AddItemsToSphere,
  AddSphereTutorial:                 AddSphereTutorial,
  AiStart:                           AiStart,
  AlexaOverview:                     AlexaOverview,
  GoogleAssistantOverview:           GoogleAssistantOverview,
  // CameraRollView:                    CameraRollView,
  // PictureView:                       PictureView,
  HubOverview:                       HubOverview,
  HubEdit:                           HubEdit,
  DeviceEdit:                        DeviceEdit,
  DeviceIconSelection:               DeviceIconSelection,
  DeviceAbilities:                   DeviceAbilities,
  DeviceOverview:                    DeviceOverview,
  DevicePowerUsage:                  DevicePowerUsage,
  DeviceSmartBehaviour:              DeviceSmartBehaviour,
  DeviceSmartBehaviour_CopyStoneSelection: DeviceSmartBehaviour_CopyStoneSelection,
  DeviceSmartBehaviour_BehaviourSelector: DeviceSmartBehaviour_BehaviourSelector,
  DeviceSmartBehaviour_Editor:       DeviceSmartBehaviour_Editor,
  DeviceSmartBehaviour_TypeSelector: DeviceSmartBehaviour_TypeSelector,
  DeviceSmartBehaviour_Wrapup:       DeviceSmartBehaviour_Wrapup,
  Ability_SwitchcraftInformation:    Ability_SwitchcraftInformation,
  Ability_DimmerSettings:            Ability_DimmerSettings,
  Ability_SwitchcraftSettings:       Ability_SwitchcraftSettings,
  Ability_TapToToggleInformation:    Ability_TapToToggleInformation,
  Ability_TapToToggleSettings:       Ability_TapToToggleSettings,
  IconDebug:                         IconDebug,
  Login:                             Login,
  LoginSplash:                       LoginSplash,
  Logout:                            Logout,
  MessageAdd:                        MessageAdd,
  MessageInbox:                      MessageInbox,
  Register:                          Register,
  RoomAdd:                           RoomAdd,
  RoomEdit:                          RoomEdit,
  RoomIconSelection:                 RoomIconSelection,
  RoomOverview:                      RoomOverview,
  RoomTraining:                      RoomTraining,
  RoomTraining_roomSize:             RoomTraining_roomSize,
  SelectFromList:                    SelectFromList,
  SettingsApp:                       SettingsApp,
  SettingsDatabaseExplorer:          SettingsDatabaseExplorer,
  SettingsBleDebug:                  SettingsBleDebug,
  SettingsBleTroubleshooting:        SettingsBleTroubleshooting,
  SettingsDeveloper:                 SettingsDeveloper,
  SettingsDevHub:                    SettingsDevHub,
  SettingsDiagnostics:               SettingsDiagnostics,
  SettingsFAQ:                       SettingsFAQ,
  SettingsFactoryResetStep1:         SettingsFactoryResetStep1,
  SettingsFactoryResetStep2:         SettingsFactoryResetStep2,
  SettingsLocalizationDebug:         SettingsLocalizationDebug,
  SettingsLogging:                   SettingsLogging,
  // SettingsMeshOverview:              SettingsMeshOverview,
  // SettingsMeshTopology:              SettingsMeshTopology,
  SettingsMeshTopologyHelp:          SettingsMeshTopologyHelp,
  SettingsOverview:                  SettingsOverview,
  SettingsPrivacy:                   SettingsPrivacy,
  SettingsProfile:                   SettingsProfile,
  SettingsRedownloadFromCloud:       SettingsRedownloadFromCloud,
  SettingsStoneBleDebug:             SettingsStoneBleDebug,
  SettingsUptime:                    SettingsUptime,
  SettingsLocalizationMonitor:       SettingsLocalizationMonitor,
  SphereBehaviour:                   SphereBehaviour,
  SphereCrownstoneOverview:          SphereCrownstoneOverview,
  SphereEdit:                        SphereEdit,
  SphereEditSettings:                SphereEditSettings,
  SphereEditMap:                     SphereEditMap,
  SphereIntegrations:                SphereIntegrations,
  SphereInvitedUser:                 SphereInvitedUser,
  SphereHubOverview:                 SphereHubOverview,
  SphereOverview:                    SphereOverview,
  SphereRoomArranger:                SphereRoomArranger,
  SphereRoomOverview:                SphereRoomOverview,
  SphereUser:                        SphereUser,
  SphereUserInvite:                  SphereUserInvite,
  SphereUserOverview:                SphereUserOverview,
  ToonAdd:                           ToonAdd,
  ToonOverview:                      ToonOverview,
  ToonSettings:                      ToonSettings,
  HueOverview:                       HueOverview,
  HueAdd:                            HueAdd,

  ScenesOverview:                    ScenesOverview,
  SceneAdd:                          SceneAdd,
  SceneEdit:                         SceneEdit,
  ScenePictureGallery:               ScenePictureGallery,
  SceneSelectCrownstones:            SceneSelectCrownstones,


  // Overlays:

  AicoreTimeCustomizationOverlay:   AicoreTimeCustomizationOverlay,
  BleStateOverlay:                  BleStateOverlay,
  DimLevelOverlay:                  DimLevelOverlay,
  ErrorOverlay:                     ErrorOverlay,
  LibMessages:                      LibMessages,
  ListOverlay:                      ListOverlay,
  LocalizationSetupStep1:           LocalizationSetupStep1,
  LocalizationSetupStep2:           LocalizationSetupStep2,
  LocationPermissionOverlay:        LocationPermissionOverlay,
  LockOverlay:                      LockOverlay,
  NumericOverlay:                   NumericOverlay,
  OptionPopup:                      OptionPopup,
  Processing:                       Processing,
  SimpleOverlay:                    SimpleOverlay,
  TextInputOverlay:                 TextInputOverlay,





  // DEV
  DEV_FirmwareTest:              DEV_FirmwareTest,
  DEV_AdvancedConfig:            DEV_AdvancedConfig,
  DEV_DFU:                       DEV_DFU,
  DEV_Batching:                  DEV_Batching,

  DEV_StoneSelector:             DEV_StoneSelector,
  DEV_RawAdvertisements:         DEV_RawAdvertisements,
  DEV_PresenceMocking:           DEV_PresenceMocking,
  DEV_UserData:                  DEV_UserData,

};