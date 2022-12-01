
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
    if (this.state.type === 'SCANNER') {
      switch (this.state.notificationType) {
        case "poweredOff":
          return "Bluetooth is turned off.";
        case "poweredOn":
          return "Bluetooth is turned on!";
        case "unauthorized":
        case "manualPermissionRequired":
          return "I can't use Bluetooth...";
        default: // "unknown":
          return "Starting Bluetooth...";
      }
    }
    else {
      switch (this.state.notificationType) {
        case "notDetermined":
          return "I don't know yet.."
        case "restricted":
        case "denied":
          return "I'm not allowed to talk to Crownstones..."
        case "authorized":
          return "All set!"
      }
    }
  }

  _getText() {
    if (this.state.type === 'SCANNER') {
      switch (this.state.notificationType) {
        case "poweredOff":
          return "Crownstones use Bluetooth to talk to your phone so it needs to be turned on to use the app.";
        case "poweredOn":
          return "Bluetooth is turned on, resuming Crownstone services.";
        case "unauthorized":
        case "manualPermissionRequired":
          return "Crownstone is not authorized to use Bluetooth. Please open the settings app on your phone, go to Crownstone in the list of apps and enable the Bluetooth permission.";
        default: // "unknown":
          return "We are turning on Bluetooth. This should not take long :).";
      }
    }
    else {
      switch (this.state.notificationType) {
        case "notDetermined":
          return "Permission dialog will appear soon!";
        case "restricted":
          return "Due to parental restrictions, I can't talk to Crownstones. Please ensure permissions for Bluetooth are granted.";
        case "denied":
          return "Permission to broadcast commands to Crownstones has been denied. Please ensure permissions for Bluetooth are granted.";
        case "authorized":
          return "Everything is working great now!";
      }
    }
  }

  _getButton() {
    switch (this.state.notificationType) {
      case "poweredOn":
        return <React.Fragment />;
      case "poweredOff":
      case "manualPermissionRequired":
      case "unauthorized":
      default:  // unknown
        return (
          <React.Fragment>
            <View style={{flex:1}} />
            <PopupButton
              callback={() => { Bluenet.requestEnableBle() }}
              label={ "Turn on Bluetooth" }
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
              NavigationUtil.showOverlay('BleStateOverlay', { notificationType: this.state.notificationType, type: this.state.type });
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
