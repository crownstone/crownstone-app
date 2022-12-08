
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BleStateOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
  View
} from "react-native";

import { IconButton }         from '../components/IconButton'
import { colors , screenHeight} from '../styles'
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import {Icon} from "../components/Icon";
import { SimpleOverlayBox } from "../components/overlays/SimpleOverlayBox";
import { Bluenet } from "../../native/libInterface/Bluenet";
import { PopupButton } from "./LocationPermissionOverlay";

export class BleStateOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      notificationType: props.notificationType, //"unauthorized", "poweredOff", "poweredOn", "unknown"
      type: props.type // "SCANNER" or "BROADCASTER"
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.nativeBus.on(core.nativeBus.topics.bleStatus, (status) => {
      switch (status) {
        case "poweredOff":
          this.setState({visible: true, notificationType: status, type: "SCANNER"});
          break;
        case "poweredOn":
          this.setState({visible: false, notificationType: status, type: "SCANNER"}, () => {
            OnScreenNotifications.removeAllNotificationsFrom("BleStateOverlay")
            NavigationUtil.closeOverlay(this.props.componentId);
          });
          break;
        case "unauthorized":
        case "manualPermissionRequired":
          this.setState({visible: true, notificationType: status, type: "SCANNER"});
          break;
        default: // "unknown":
          this.setState({notificationType: status, type: "SCANNER"});
          break;
      }
    }));

    this.unsubscribe.push(core.nativeBus.on(core.nativeBus.topics.bleBroadcastStatus, (status) => {
      switch (status) {
        case "notDetermined":
          this.setState({notificationType: status, type: "BROADCASTER"});
          break;
        case "restricted":
          this.setState({visible: true, notificationType: status, type: "BROADCASTER"});
          break;
        case "denied":
          this.setState({visible: true, notificationType: status, type: "BROADCASTER"});
          break;
        case "authorized":
          this.setState({visible: false, notificationType: status, type: "BROADCASTER"}, () => {
            OnScreenNotifications.removeAllNotificationsFrom("BleStateOverlay");
            NavigationUtil.closeOverlay(this.props.componentId);
          });
          break;
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getTitle() {
    if (Platform.OS === 'android') {
      switch (this.state.notificationType) {
        case "poweredOff":
          return lang("Bluetooth_is_turned_off_");
        case "poweredOn":
          return lang("Bluetooth_is_turned_on_");
        case "unauthorized":
        case "manualPermissionRequired":
        default:
          return lang("Permissions_are_missing");
      }
    }

    if (this.state.type === 'SCANNER') {
      switch (this.state.notificationType) {
        case "poweredOff":
          return lang("Bluetooth_is_turned_off_");
        case "poweredOn":
          return lang("Bluetooth_is_turned_on_");
        case "unauthorized":
        case "manualPermissionRequired":
          return lang("I_cant_use_Bluetooth___");
        default: // "unknown":
          return lang("Starting_Bluetooth___");
      }
    }
    else {
      switch (this.state.notificationType) {
        case "notDetermined":
          return lang("I_dont_know_yet__")
        case "restricted":
        case "denied":
          return lang("Im_not_allowed_to_talk_to")
        case "authorized":
          return lang("All_set_")
      }
    }
  }

  _getText() {
    if (Platform.OS === 'android') {
      switch (this.state.notificationType) {
        case "poweredOn":
          return lang("Bluetooth_is_turned_on__r");
        case "poweredOff":
          return lang("Crownstones_use_Bluetooth");
        case "unauthorized":
          return lang("Without_permission__the_a");
        case "manualPermissionRequired":
          return lang("Without_permission__the_ap");
        default: // "unknown":
          return lang("We_are_turning_on_Bluetoo");
      }
    }

    if (this.state.type === 'SCANNER') {
      switch (this.state.notificationType) {
        case "poweredOff":
          return lang("Crownstones_use_Bluetooth_");
        case "poweredOn":
          return lang("Bluetooth_is_turned_on__re");
        case "unauthorized":
        case "manualPermissionRequired":
          return lang("Crownstone_is_not_authori");
        default: // "unknown":
          return lang("We_are_turning_on_Bluetooth");
      }
    }
    else {
      switch (this.state.notificationType) {
        case "notDetermined":
          return lang("Permission_dialog_will_ap");
        case "restricted":
          return lang("Due_to_parental_restricti");
        case "denied":
          return lang("Permission_to_broadcast_c");
        case "authorized":
          return lang("Everything_is_working_gre");
      }
    }
  }

  _getButton() {
    // Android only
    switch (this.state.notificationType) {
      case "poweredOn":
        return <React.Fragment />;
      case "poweredOff":
        return (
          <React.Fragment>
            <View style={{flex:1}} />
            <PopupButton
              callback={() => { Bluenet.requestEnableBle() }}
              label={ lang("Turn_on_Bluetooth")}
            />
          </React.Fragment>
        );
      case "unauthorized":
        return (
          <React.Fragment>
            <View style={{flex:1}} />
            <PopupButton
              callback={() => { Bluenet.requestBlePermission() }}
              label={ lang("Request_permission") }
            />
          </React.Fragment>
        );
      case "manualPermissionRequired":
      default:  // unknown
        return (
          <React.Fragment>
            <View style={{flex:1}} />
            <PopupButton
              callback={() => { Bluenet.gotoOsAppSettings() }}
              label={ lang("Request_permission") }
            />
          </React.Fragment>
        );
    }
  }


  render() {
    return (
      <SimpleOverlayBox
        visible={this.state.visible}
        overrideBackButton={false}
        canClose={true}
        closeCallback={() => {
          NavigationUtil.closeOverlay(this.props.componentId);
          OnScreenNotifications.setNotification({
            source: "BleStateOverlay",
            id: "bluetoothState",
            label: lang("Bluetooth_disabled"),
            icon: "ios-bluetooth",
            backgroundColor: colors.csOrange.rgba(0.5),
            callback: () => {
              NavigationUtil.showOverlay('BleStateOverlay', { notificationType: core.permissionState.bluetooth, type: core.permissionState.bluetoothType });
            }
          })
        }}
      >
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <Icon
            name="ios-bluetooth"
            size={0.15*screenHeight}
            color={colors.blue.hex}
          />
          <View style={{flex:1}} />
          <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.black.hex, padding:15, }}>{this._getTitle()}</Text>
          <Text style={{fontSize: 12, color: colors.black.hex, padding:15, textAlign:'center'}}>
            {this._getText()}
          </Text>
          { Platform.OS === 'android' && this._getButton() }
          <View style={{flex:1}} />
        </View>
      </SimpleOverlayBox>
    );
  }
}
