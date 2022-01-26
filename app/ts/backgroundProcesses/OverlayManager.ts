import { core } from "../Core";
import { NavigationUtil } from "../util/NavigationUtil";
import { Alert } from "react-native";
import { LOGe, LOGi } from "../logging/Log";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";


class OverlayManagerClass {
  _initialized : boolean = false;
  _initializedStateOverlays : boolean = false;

  init() {
    if (this._initialized === false) {
      core.eventBus.on('showAicoreTimeCustomizationOverlay', (data) => { NavigationUtil.showOverlay('AicoreTimeCustomizationOverlay',{data: data}); })

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



      core.eventBus.on('showDimLevelOverlay',  (data) => { NavigationUtil.showOverlay('DimLevelOverlay',   {data: data}); })
      core.eventBus.on('showLockOverlay',      (data) => { NavigationUtil.showOverlay('LockOverlay',   {data: data}); })
      core.eventBus.on('showPopup',            (data) => { NavigationUtil.showOverlay('OptionPopup',   {data: data}); })
      core.eventBus.on('showLoading',          (data) => { NavigationUtil.showOverlay('Processing',    {data: data}); })
      core.eventBus.on('showProgress',         (data) => { NavigationUtil.showOverlay('Processing',    {data: data}); })
      core.eventBus.on('showCustomOverlay',    (data) => { NavigationUtil.showOverlay('SimpleOverlay', {data: data}); })
      core.eventBus.on('showNumericOverlay',   (data) => { NavigationUtil.showOverlay('NumericOverlay',{data: data}); })
      core.eventBus.on('showTextInputOverlay', (data) => { NavigationUtil.showOverlay('TextInputOverlay',{data: data}); })
    }
    this._initialized = true;

    // setTimeout(() => {
    //   core.eventBus.emit("showAicoreTimeCustomizationOverlay", {data: {
    //       callback: (newTime: aicoreTime) => {
    //       },
    //       time: null,
    //       image: require("../../assets/images/overlayCircles/time.png")
    //     }
    //   })
    // })

    // setTimeout(() => {
    //   core.eventBus.emit("showDimLevelOverlay",{
    //     initialValue: 59,
    //     callback: (value) => {
    //     }
    //   })
    // })

    // setTimeout(() => {
    //   let state = core.store.getState();
    //   let sphereId = Object.keys(state.spheres)[0];
    //   let stoneId = Object.keys(state.spheres[sphereId].stones)[0]
    //   core.eventBus.emit('showErrorOverlay', {stoneId: stoneId, sphereId: sphereId});
    // },2000)

    // setTimeout(() => {
    //   let state = core.store.getState();
    //   let sphereId = Object.keys(state.spheres)[0];
    //   let stoneId = Object.keys(state.spheres[sphereId].stones)[0]
    //   core.eventBus.emit('showLockOverlay', {stoneId: stoneId, sphereId: sphereId});
    // },2000)

    // setTimeout(() => {
    //   let state = core.store.getState();
    //   let sphereId = Object.keys(state.spheres)[0];
    //   core.eventBus.emit("showLocalizationSetupStep2", sphereId);
    // },2000)

    // setTimeout(() => {
    //   core.eventBus.emit("showNumericOverlay",{
    //     value: '2',
    //     title: "here",
    //     text: "Input a number and press set, or close this window.",
    //     callback: () => {}
    //   })
    // },1000)

    // setTimeout(() => {
    //   let state = core.store.getState();
    //   let sphereId = Object.keys(state.spheres)[0];
    //   core.eventBus.emit('showListOverlay', {
    //     title: "Select room",
    //     getItems: () => {
    //       const state = core.store.getState();
    //       const sphere = state.spheres[sphereId];
    //       let items = [];
    //       Object.keys(sphere.locations).forEach((locationId) => {
    //           let location = sphere.locations[locationId];
    //           items.push( {id: location.config.uid, component: <RoomList
    //             icon={location.config.icon}
    //             name={location.config.name}
    //             hideSubtitle={true}
    //             showNavigationIcon={false}
    //             small={true}
    //           />})
    //         });
    //
    //           return items;
    //         },
    //         callback: (selection) => {
    //       },
    //         themeColor: colors.green.rgba(0.8),
    //         allowMultipleSelections: true,
    //         selection: null,
    //         image: require("../../assets/images/overlayCircles/roomsCircle.png")
    //     })
    // },1000)
  }

  initStateOverlays() {
    if (this._initializedStateOverlays === false) {
      // ble status popup
      core.nativeBus.on(core.nativeBus.topics.bleStatus, (status) => {
        LOGi.info("OverlayManager: Received bleStatus status", status)
        switch (status) {
          case "poweredOff":
          case "unauthorized":
            core.bleState.bleAvailable = false;
            NavigationUtil.showOverlay('BleStateOverlay', { notificationType: status, type: "SCANNER" });
            break;
          default:
            core.bleState.bleAvailable = true;
            OnScreenNotifications.removeAllNotificationsFrom("BleStateOverlay");
        }
      });
      core.nativeBus.on(core.nativeBus.topics.bleBroadcastStatus, (status) => {
        LOGi.info("OverlayManager: Received bleBroadcastStatus status", status)
        switch (status) {
          case "restricted":
          case "denied":
            core.bleState.bleBroadcastAvailable = false;
            NavigationUtil.showOverlay('BleStateOverlay', { notificationType: status, type: "BROADCASTER" });
            break;
          default:
            core.bleState.bleBroadcastAvailable = true;
        }
      });

      // location permission updates.
      core.nativeBus.on(core.nativeBus.topics.locationStatus, (status) => {
        LOGi.info("OverlayManager: Received locations status", status)
        switch (status) {
          case "off":
          case "unknown":
          case "noPermission":
          case "foreground":
            NavigationUtil.showOverlay('LocationPermissionOverlay',{status: status});
            break;
          case "on":
            break;
          default:
            LOGe.info("OverlayManager: UNKNOWN PERMISSION FOR LOCATION", status);
        }
      });
    }
    this._initializedStateOverlays = true;
  }
}

export const OverlayManager = new OverlayManagerClass();












