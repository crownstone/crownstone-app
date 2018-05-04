import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OverlayBox }         from '../components/overlays/OverlayBox'
import { colors, screenHeight, screenWidth} from '../styles'
import {eventBus} from "../../util/EventBus";
const Swiper = require("react-native-swiper");
import { Awesome } from "./WhatsNew/Awesome";
import {Mesh} from "./WhatsNew/2.0.0/Mesh";
import {Dimmer} from "./WhatsNew/2.0.0/Dimmer";
import {FirmwareUpdate} from "./WhatsNew/2.0.0/FirmwareUpdate";
import {BatteryImprovements} from "./WhatsNew/2.0.0/BatteryImprovements";
import {Locking} from "./WhatsNew/2.0.0/Locking";

const DeviceInfo = require('react-native-device-info');

export class WhatsNewOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = { visible: false };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showWhatsNew", () => {
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
      content.push(<Dimmer key="Dimmer"  {...size}/>);
      content.push(<Mesh key="Mesh"  {...size}/>);
      content.push(<FirmwareUpdate key="FirmwareUpdate"  {...size}/>);
      content.push(<Locking key="Locking"  {...size}/>);
      content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
    }
    if (Platform.OS === 'android') {
      content.push(<Dimmer key="Dimmer"  {...size} />);
      // content.push(<Mesh key="Mesh"  {...size}/>);
      content.push(<FirmwareUpdate key="FirmwareUpdate"  {...size}/>);
      content.push(<Locking key="Locking"  {...size}/>);
      // content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
    }
    content.push(<Awesome key="Awesome" closeCallback={() => { this._closePopup() }} {...size} />);

    return content;
  }

  _closePopup() {
    this.setState({visible: false});
    this.props.store.dispatch({type:"UPDATE_APP_SETTINGS", data:{shownWhatsNewVersion : DeviceInfo.getReadableVersion()} })
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
        closeCallback={() => {
          this._closePopup()
        }}
      >
        <Text style={{
          fontSize: 18,
          fontWeight:'bold',
          backgroundColor:'transparent',
          color:colors.csBlue.hex,
          marginTop:15,
          marginBottom:25,
          overflow:'hidden'
        }}>Your app was updated!</Text>
        <Swiper style={{}} showsPagination={true} height={height-80} width={width}
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