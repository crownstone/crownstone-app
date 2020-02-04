
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BleStateOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import { colors , screenHeight} from '../styles'
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";

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
          return "We can't use Bluetooth...";
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

  render() {
    let state = core.store.getState();
    return (
      <OverlayBox
        visible={this.state.visible}
        overrideBackButton={false}
        canClose={state.development.devAppVisible && state.user.developer}
        closeCallback={() => {
          NavigationUtil.closeOverlay(this.props.componentId);
          OnScreenNotifications.setNotification({
            source: "BleStateOverlay",
            id: "bluetoothState",
            label: "Bluetooth disabled",
            icon: "ios-bluetooth",
            backgroundColor: colors.csOrange.hex,
            callback: () => {
              NavigationUtil.showOverlay('BleStateOverlay', { notificationType: this.state.notificationType, type: this.state.type });
            }
          })
        }}
      >
        <View style={{flex:1}} />
        <IconButton
          name="ios-bluetooth"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.blue.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top:0.008*screenHeight}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue.hex, padding:15}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 12, color: colors.blue.hex, padding:15, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}