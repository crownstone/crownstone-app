import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { SetupStateHandler } from '../../../native/setup/SetupStateHandler'
import { Icon } from '../Icon';
import { styles, colors, screenWidth } from '../../styles'
import { getUserLevelInSphere } from '../../../util/DataUtil'
import {Util} from "../../../util/Util";
import {NativeBus} from "../../../native/libInterface/NativeBus";


export class DfuDeviceEntry extends Component<any, any> {
  baseHeight : any;
  currentLoadingWidth : any;
  dfuEvents : any;
  rssiTimeout : any = null;

  constructor(props) {
    super();

    this.baseHeight = props.height || 80;
    this.state = {
      name: props.name || 'DFU Crownstone',
      subtext: 'Tap here to configure me!',
      showRssi: false,
      rssi: null
    };

    this.currentLoadingWidth = 0;
    this.dfuEvents = [];
  }

  componentDidMount() {
    this.dfuEvents.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (data) => {
      if (data.handle === this.props.handle) {
        if (data.rssi < 0) {
          if (this.state.rssi === null) {
            this.setState({rssi: data.rssi, showRssi: true});
          }
          else {
            this.setState({rssi: Math.round(0.2 * data.rssi + 0.8 * this.state.rssi), showRssi: true});
          }
          clearTimeout(this.rssiTimeout);
          this.rssiTimeout = setTimeout(() => {
            this.setState({showRssi: false, rssi: null})
          }, 5000);
        }
      }
    }));
  }

  componentWillUnmount() { // cleanup
    clearTimeout(this.rssiTimeout);
    this.dfuEvents.forEach((unsubscribe) => { unsubscribe(); });
  }

  _getIcon() {
    return (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: colors.purple.hex,
        }, styles.centered]}>
        <Icon name={'ios-settings'} size={50} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
      </View>
    );
  }


  render() {
    return (
      <View style={{flexDirection: 'column', height: this.baseHeight, flex: 1}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.performDFU(); }}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.performDFU(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{this.props.name}</Text>
              {this._getSubText()}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  performDFU() {
    if (getUserLevelInSphere(this.props.store.getState(), this.props.sphereId) !== 'admin') {
      Alert.alert("You don't have permission","You can ask an admin in your Sphere to setup this Crownstone",[{text:'OK'}])
    }
    else {
      this.props.eventBus.emit("updateCrownstoneFirmware", {stoneId: this.props.stoneId, sphereId: this.props.sphereId, alreadyInDfuMode: true});
    }
  }

  _getSubText() {
    if (this.state.showRssi && SetupStateHandler.isSetupInProgress() === false) {
      if (this.state.rssi > -40) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Very Near)'}</Text>
        </View>;
      }
      if (this.state.rssi > -60) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Near)'}</Text>
        </View>;
      }
      else if (this.state.rssi > -80) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Visible)'}</Text>
        </View>;
      }
      else if (this.state.rssi > -90) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Barely visible)'}</Text>
        </View>;
      }
      else {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Too far away)'}</Text>
        </View>;
      }
    }
    else {
      return <View style={{flexDirection: 'column'}}>
        <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
        <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{''}</Text>
      </View>;
    }
  }
}