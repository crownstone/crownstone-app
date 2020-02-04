import { core } from "../core";
import { NavigationUtil } from "../util/NavigationUtil";
import { Alert } from "react-native";
import { LOGe } from "../logging/Log";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";


class OverlayManagerClass {
  _initialized : boolean = false;

  init() {
    if (this._initialized === false) {
      core.eventBus.on('showAicoreTimeCustomizationOverlay', (data) => { NavigationUtil.showOverlay('AicoreTimeCustomizationOverlay',{data: data}); })

      // ble status popup
      core.nativeBus.on(core.nativeBus.topics.bleStatus, (status) => {
        switch (status) {
          case "poweredOff":
          case "unauthorized":
            NavigationUtil.showOverlay('BleStateOverlay', { notificationType: status, type: "SCANNER" });
            break;
          default:
            OnScreenNotifications.removeAllNotificationsFrom("BleStateOverlay");
        }
      });
      core.nativeBus.on(core.nativeBus.topics.bleBroadcastStatus, (status) => {
        switch (status) {
          case "restricted":
          case "denied":
            NavigationUtil.showOverlay('BleStateOverlay', { notificationType: status, type: "BROADCASTER" });
            break;
        }
      });

      // alert from the lib(s)
      core.nativeBus.on(core.nativeBus.topics.libAlert, (data) => {
        Alert.alert(data.header, data.body,[{text: data.buttonText }]);
      })
      // message popup from the lib
      core.nativeBus.on(core.nativeBus.topics.libPopup,
        (data) => { NavigationUtil.showOverlay('LibMessages',{data: data});
      });

      // hardware errors
      core.eventBus.on('showErrorOverlay', (data) => { NavigationUtil.showOverlay('ErrorOverlay', {data: data}); });

      core.eventBus.on('showListOverlay', (data) => { NavigationUtil.showOverlay('ListOverlay',{data: data}); });

      // localization popup.
      core.eventBus.on('showLocalizationSetupStep1', (data) => { NavigationUtil.showOverlay('LocalizationSetupStep1',{data: data}); })
      core.eventBus.on('showLocalizationSetupStep2', (data) => { NavigationUtil.showOverlay('LocalizationSetupStep2',{data: data}); })

      // location permission updates.
      core.nativeBus.on(core.nativeBus.topics.locationStatus, (status) => {
        switch (status) {
          case "off":
          case "unknown":
          case "noPermission":
          case "foreground":
          case "unknown":
            NavigationUtil.showOverlay('LocationPermissionOverlay',{status: status});
            break;
          case "on":
            break;
          default:
            LOGe.info("OverlayManager: UNKNOWN PERMISSION FOR LOCATION", status);
        }
      });

      core.eventBus.on('showLockOverlay',      (data) => { NavigationUtil.showOverlay('LockOverlay',   {data: data}); })
      core.eventBus.on('showPopup',            (data) => { NavigationUtil.showOverlay('OptionPopup',   {data: data}); })
      core.eventBus.on('showLoading',          (data) => { NavigationUtil.showOverlay('Processing',    {data: data}); })
      core.eventBus.on('showProgress',         (data) => { NavigationUtil.showOverlay('Processing',    {data: data}); })
      core.eventBus.on('showCustomOverlay',    (data) => { NavigationUtil.showOverlay('SimpleOverlay', {data: data}); })
      core.eventBus.on('showNumericOverlay',   (data) => { NavigationUtil.showOverlay('NumericOverlay',{data: data}); })
    }

    this._initialized = true;

  }
}

export const OverlayManager = new OverlayManagerClass();












