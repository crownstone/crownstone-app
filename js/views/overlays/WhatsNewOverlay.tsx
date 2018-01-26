import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OverlayBox }         from '../components/overlays/OverlayBox'
import { styles, colors, screenHeight, screenWidth, availableScreenHeight } from '../styles'
import {eventBus} from "../../util/EventBus";
const Swiper = require("react-native-swiper");
import { Awesome } from "./WhatsNew/Awesome";
import {Mesh} from "./WhatsNew/2.0.0/Mesh";
import {Dimmer} from "./WhatsNew/2.0.0/Dimmer";
import {FirmwareUpdate} from "./WhatsNew/2.0.0/FirmwareUpdate";
import {BatteryImprovements} from "./WhatsNew/2.0.0/BatteryImprovements";

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
    let size = {height: height-50, width: width};

    if (Platform.OS === 'ios') {
      content.push(<Dimmer key="Dimmer"  {...size}/>);
      content.push(<Mesh key="Mesh"  {...size}/>);
      content.push(<FirmwareUpdate key="FirmwareUpdate"  {...size}/>);
      content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
    }
    if (Platform.OS === 'android') {
      content.push(<Dimmer key="Dimmer"  {...size} />);
      content.push(<Mesh key="Mesh"  {...size}/>);
      content.push(<FirmwareUpdate key="FirmwareUpdate"  {...size}/>);
      content.push(<BatteryImprovements key="BatteryImprovements"  {...size}/>);
    }
    content.push(<Awesome key="Awesome" closeCallback={() => { this._closePopup() }} {...size} />);

    return content;
  }

  _closePopup() {
    this.setState({visible: false});
    this.props.store.dispatch({type:"UPDATE_APP_SETTINGS", data:{shownWhatsNewVersion : DeviceInfo.getReadableVersion()} })
  }

  render() {
    let height = 0.9 * availableScreenHeight;
    let width = 0.85*screenWidth-35;
    return (
      <OverlayBox
        visible={this.state.visible}
        overrideBackButton={true}
        height={height}
        canClose={true}
        closeCallback={() => {
          this._closePopup()
        }}
      >
        <Text style={{
          fontSize: 18,
          fontWeight:'bold',
          marginBottom:15,
          backgroundColor:'transparent',
          color:colors.csBlue.hex,
          marginTop:15,
          overflow:'hidden'
        }}>Your app was updated!</Text>
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={height-85} width={width}
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