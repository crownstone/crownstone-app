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
import {Util} from "../../../util/Util";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";


export class SetupDeviceEntry extends Component<any, any> {
  baseHeight : any;
  currentLoadingWidth : any;
  setupEvents : any;
  rssiTimeout : any = null;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;

    this.state = {
      progressWidth: new Animated.Value(0),
      name: props.item.name,
      subtext: 'Tap here to add it to this Sphere!',
      disabled: false,
      setupInProgress: false,
      showRssi: false,
      rssi: null
    };

    this.currentLoadingWidth = 0;
    this.setupEvents = [];
  }

  componentDidMount() {
    this.setupEvents.push(this.props.eventBus.on(Util.events.getSetupTopic(this.props.handle), (data) => {
      if (data.rssi < 0) {
        if (this.state.rssi === null) {
          this.setState({rssi: data.rssi, showRssi: true});
        }
        else {
          this.setState({rssi: Math.round(0.2 * data.rssi + 0.8 * this.state.rssi), showRssi: true});
        }
        clearTimeout(this.rssiTimeout);
        this.rssiTimeout = setTimeout(() => { this.setState({showRssi: false, rssi: null}) }, 5000);
      }
    }));

    this.setupEvents.push(this.props.eventBus.on("setupStarted",  (handle) => {
      if (this.props.handle === handle) {
        this.setProgress('pending');
      }
    }));

    this.setupEvents.push(this.props.eventBus.on("setupCancelled", (handle) => {
      this.setProgress(0);
    }));
    this.setupEvents.push(this.props.eventBus.on("setupComplete", (handle) => {
      if (this.props.handle !== handle) {
        this.setProgress(0);
      }
    }));
    this.setupEvents.push(this.props.eventBus.on("setupInProgress", (data) => {
      if (this.props.handle === data.handle) {
        this.setProgress(data.progress);
      }
      else {
        this.setProgress(-1);
      }
    }));
  }

  componentWillUnmount() { // cleanup
    clearTimeout(this.rssiTimeout);
    this.setupEvents.forEach((unsubscribe) => { unsubscribe(); });
  }

  _getActivityIndicator() {
    if (this.state.setupInProgress) {
      return (
        <View style={{height: this.baseHeight, width: 60, alignItems: 'flex-end', justifyContent: 'center'}}>
          <ActivityIndicator animating={true} size="large"/>
        </View>
      );
    }
  }

  _getIcon() {
    let color = colors.blinkColor1.hex;
    if (this.state.disabled === true)
      color = colors.gray.hex;
    else if (this.state.setupInProgress === true)
       color = colors.blinkColor2.hex;

    return (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={this.props.item.icon} size={35} color={'#ffffff'} style={{ backgroundColor:'transparent' }} />
      </View>
    );
  }


  setProgress(value : any = 0) {
    switch(value) {
      case -1:
        this.setState({subtext:'Another Crownstone is pairing.', setupInProgress:false, disabled: true});
        break;
      case 0:
        this.setState({subtext:'Click here to add it to this Sphere!', disabled: false, setupInProgress: false});
        break;
      case 'pending':
        this.setState({subtext:'Starting setup...', setupInProgress: true});
        Animated.timing(this.state.progressWidth, {toValue: 0, duration: 100}).start();
        return;
      case 1:
        this.setState({subtext:"Claiming... Please stay close!", setupInProgress: true});
        break;
      case 3:
        this.setState({subtext:"Registering in the Cloud...", setupInProgress: true});
        break;
      case 4:
        this.setState({subtext:"Setting up Crownstone...", setupInProgress: true});
        break;
      case 19:
        this.setState({subtext:"Finalizing setup..."});
        break;
      default: {
        this.setState({setupInProgress: true});
      }
    }


    let max = 19;
    let loadingWidth = screenWidth * (Math.max(0,value)/max);
    if (this.currentLoadingWidth !== loadingWidth) {
      this.currentLoadingWidth = loadingWidth;
      Animated.timing(this.state.progressWidth, {toValue: loadingWidth, duration: 100}).start();
    }
  }

  render() {
    let loadingHeight = 5;
    return (
      <View style={{flexDirection: 'column', height: this.baseHeight, flex: 1}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.setupStone(); }}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.setupStone(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{this.state.name}</Text>
              {this._getSubText()}
            </View>
          </TouchableOpacity>
          {this._getActivityIndicator()}
        </View>
        <Animated.View style={{position:'relative', left:-15, top: 0, width: this.state.progressWidth, height:loadingHeight, backgroundColor:colors.green2.hex}} />
      </View>
    );
  }

  setupStone() {
    if (Permissions.inSphere(this.props.sphereId).setupCrownstone) {
      if (this.state.disabled === false && this.state.setupInProgress !== true) {
        SetupStateHandler.setupStone(this.props.handle, this.props.sphereId).catch((err) => {  })
      }
    }
    else {
      Alert.alert("You don't have permission", "You can ask an admin in your Sphere to setup this Crownstone", [{text: 'OK'}])
    }
  }

  _getSubText() {
    if (this.state.showRssi && SetupStateHandler.isSetupInProgress() === false) {
      if (this.state.rssi > -50) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Very Near)'}</Text>
        </View>;
      }
      if (this.state.rssi > -75) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Near)'}</Text>
        </View>;
      }
      else if (this.state.rssi > -90) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{'(Visible)'}</Text>
        </View>;
      }
      else if (this.state.rssi > -95) {
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