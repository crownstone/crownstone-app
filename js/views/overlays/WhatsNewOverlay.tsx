import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OverlayBox }         from '../components/overlays/OverlayBox'
import { styles, colors, screenHeight, screenWidth, availableScreenHeight } from '../styles'
import {eventBus} from "../../util/EventBus";
import * as Swiper from 'react-native-swiper';
import { PhysicsBasedSphereUI } from "./WhatsNew/1.10.0/PhysicsBasedSphereUI";
import { WhatsNew } from "./WhatsNew/1.10.0/WhatsNew";
import { NewDeviceUI } from "./WhatsNew/1.10.0/NewDeviceUI";
import { NewDeviceUIGraph } from "./WhatsNew/1.10.0/NewDeviceUIGraph";
import { NewLocalizationSettings } from "./WhatsNew/1.10.0/NewLocalizationSettings";
import {Awesome} from "./WhatsNew/1.10.0/Awesome";
import {NewScheduler} from "./WhatsNew/1.10.0/NewScheduler";

const DeviceInfo = require('react-native-device-info');

export class WhatsNewOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();

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

  _getContent() {
    let content = [];

    content.push(<WhatsNew key="whatsNewOverview" />);
    content.push(<PhysicsBasedSphereUI key="PhysicsBasedSphereUI" />);
    content.push(<NewDeviceUI key="NewDeviceUI" />);
    content.push(<NewScheduler key="NewScheduler" />);
    content.push(<NewDeviceUIGraph key="NewDeviceUIGraph" />);
    content.push(<NewLocalizationSettings key="NewLocalizationSettings" />);
    content.push(<Awesome key="Awesome" closeCallback={() => { this._closePopup() }}/>);

    return content;
  }

  _closePopup() {
    this.setState({visible: false});
    this.props.store.dispatch({type:"UPDATE_APP_SETTINGS", data:{shownWhatsNewVersion : DeviceInfo.getReadableVersion()} })
  }

  render() {
    let height = 0.9 * availableScreenHeight;
    return (
      <OverlayBox visible={this.state.visible} overrideBackButton={true} height={height} canClose={true} closeCallback={() => {
        this._closePopup()
      }}>
        <Text style={{fontSize: 18, fontWeight:'bold', paddingTop:10, paddingBottom:10, color:colors.csBlue.hex}}>Your app was updated!</Text>
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={height-85} width={0.85*screenWidth-35}
            dot={<View style={{backgroundColor: colors.csBlue.rgba(0.2), width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
            activeDot={<View style={{backgroundColor: colors.csBlue.rgba(0.8), width: 8, height: 8, borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
            loop={false}
            bounces={true}
        >
          { this._getContent() }
        </Swiper>
      </OverlayBox>
    );
  }
}


let swiperStyles = StyleSheet.create({
  wrapper: {
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  }
});