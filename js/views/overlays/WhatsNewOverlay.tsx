
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("WhatsNewOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
  View,
} from 'react-native';

import { OverlayBox }         from '../components/overlays/OverlayBox'
import { colors, screenHeight, screenWidth} from '../styles'

const Swiper = require("react-native-swiper");
import { Awesome } from "./WhatsNew/Awesome";
import {ActivityLog} from "./WhatsNew/2.2.0/ActivityLog";
import {Diagnostics} from "./WhatsNew/2.2.0/Diagnostics";
import {ToonIsNew} from "./WhatsNew/2.2.0/ToonIsNew";
import {NewSphereSettings} from "./WhatsNew/2.2.0/NewSphereSettings";
import {MoveRooms} from "./WhatsNew/2.2.0/MoveRooms";
import { BatteryImprovements } from "./WhatsNew/2.0.0/BatteryImprovements";
import { MultiSphere } from "./WhatsNew/2.3.0/MultiSphere";
import { AlexaIntegration } from "./WhatsNew/2.3.0/AlexaIntegration";
import { AppleWatch } from "./WhatsNew/2.3.0/AppleWatch";
import { AndroidLib } from "./WhatsNew/2.3.0/AndroidLib";

import DeviceInfo from 'react-native-device-info';
import { core } from "../../core";

export class WhatsNewOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = { visible: false };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("showWhatsNew", () => {
      this.setState({visible: true});
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getContent(width, height) {
    let content = [];
    let size = {height: height-10, width: width};

    if (Platform.OS === 'ios') {
      content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
      content.push(<AlexaIntegration key="AlexaIntegration"  {...size}/>);
      content.push(<AppleWatch key="AppleWatch"  {...size}/>);
      content.push(<MultiSphere key="MultiSphere"  {...size}/>);
    }
    if (Platform.OS === 'android') {
      content.push(<AndroidLib key="AndroidLib"  {...size}/>);
      content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
      content.push(<ToonIsNew key="ToonIsNew"  {...size}/>);
      content.push(<NewSphereSettings key="NewSphereSettings"  {...size}/>);
      content.push(<MoveRooms key="MoveRooms"  {...size}/>);
      content.push(<ActivityLog key="ActivityLog"  {...size}/>);
      content.push(<Diagnostics key="Diagnostics"  {...size}/>);
      content.push(<AlexaIntegration key="AlexaIntegration"  {...size}/>);
      content.push(<MultiSphere key="MultiSphere"  {...size}/>);
    }
    content.push(<Awesome key="Awesome" closeCallback={() => { this._closePopup() }} {...size} />);

    return content;
  }

  _closePopup() {
    this.setState({visible: false});
    core.store.dispatch({type:"UPDATE_APP_SETTINGS", data:{shownWhatsNewVersion : DeviceInfo.getReadableVersion()} })
  }

  render() {
    let idealAspectRatio = 1.8354978354978355;

    let width = 0.85*screenWidth-30;
    let height = Math.min(width*idealAspectRatio, 0.9 * screenHeight);

    return (
      <OverlayBox
        visible={this.state.visible}
        overrideBackButton={true}
        height={height}
        canClose={true}
        style={{padding:0}}
        title={lang("Your_App_was_updated_")}
        closeCallback={() => { this._closePopup() }}>
        <Swiper style={{}} showsPagination={true} height={height-80} width={width}
          loadMinimal={true}
          loadMinimalSize={2}
          dot={<View style={{backgroundColor: colors.menuBackground.rgba(0.15), width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.menuBackground.rgba(0.2)}} />}
          activeDot={<View style={{backgroundColor: colors.white.rgba(1), width: 9, height: 9, borderRadius: 4.5, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.csOrange.rgba(1)}} />}
          loop={false}
          bounces={true}
        >
          { this._getContent(width, height) }
        </Swiper>

      </OverlayBox>
    );
  }
}