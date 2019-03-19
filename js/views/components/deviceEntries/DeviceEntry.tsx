
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import { Util } from '../../../util/Util'
import { styles, colors}        from '../../styles'
import { AlternatingContent }                 from '../animated/AlternatingContent';
import { MINIMUM_REQUIRED_FIRMWARE_VERSION }  from '../../../ExternalConfig';
import { INTENTS }                            from '../../../native/libInterface/Constants';
import { Actions }                            from 'react-native-router-flux';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { DeviceEntrySubText }                 from "./DeviceEntrySubText";
import {AnimatedCircle} from "../animated/AnimatedCircle";
import {SlideFadeInView} from "../animated/SlideFadeInView";
import { xUtil } from "../../../util/StandAloneUtil";
import { STONE_TYPES } from "../../../Enums";


export class DeviceEntry extends Component<any, any> {
  baseHeight : number;
  unsubscribe = [];
  animating = false;
  id = xUtil.getUUID();

  showMeshMessageTimeout

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;

    this.state = {
      height:          this.baseHeight,
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
      showViaMesh: false
    };
  }

  componentDidMount() {
    // this event makes the background of the device entry blink to incidate the error.
    this.unsubscribe.push(this.props.eventBus.on('showErrorInOverview', (stoneId) => {
      if (stoneId === this.props.stoneId) {
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 90 }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, duration: 2500 }).start();
        }, 5000);
      }
    }));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    clearTimeout(this.showMeshMessageTimeout);
  }


  _pressedDevice(stone) {
    let newState = (stone.state.state > 0 ? 0 : 1);
    if (stone.config.dimmingEnabled === true) {
      newState = (stone.state.state > 0 ? 0 : 0.99);
    }

    this.setState({pendingCommand:true});

    StoneUtil.switchBHC(
      this.props.sphereId,
      this.props.stoneId,
      stone, newState,
      this.props.store,
      {keepConnectionOpen: true, keepConnectionOpenTimeout: 2},
      (err, result) => {
        let newState = {pendingCommand:false};
        if (!err && result && result.viaMesh === true) {
          newState['showViaMesh'] = true;
          this.showMeshMessageTimeout = setTimeout(() => { this.setState({showViaMesh: false})}, 1000);
        }
        this.setState(newState);
      },
      INTENTS.manual,
      1,
      'from _pressedDevice in DeviceEntry'
    );
  }

  _getControl(stone) {
    let content;
    let action = null;
    if (stone.reachability.disabled === false) {
      if (stone.errors.hasError) {
        content = <Switch value={stone.state.state === 1} disabled={true} />;
        action = () => { this._basePressed(); }
      }
      else if (stone.config.locked) {
        content = <Icon name={'md-lock'} color={colors.black.rgba(0.2)} size={32} />;
        action = () => { this._basePressed(); }
      }
      else if (this.state.pendingCommand === true) {
        content = <ActivityIndicator animating={true} size='large' />;
      }
      else {
        content = <Switch value={stone.state.state > 0} onValueChange={() => { this._pressedDevice(stone); }}/>;
        action = () => { this._pressedDevice(stone);  }
      }
    }


    let wrapperStyle = {height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'};
    if (action) {
      return (
        <TouchableOpacity onPress={() => { action() }} style={wrapperStyle}>
          {content}
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle}>{content}</View>;
    }
  }

  _basePressed() {
    Actions.deviceOverview({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
  }

  _getIcon(element, stone, state) {
    let customStyle = undefined;
    let color = (
      stone.reachability.disabled === true ?
          colors.gray.hex :
          (stone.state.state > 0 ? colors.green.hex : colors.menuBackground.hex)
    );

    if (stone.errors.hasError === true) {
      return (
        <View style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: colors.csOrange.hex,
          borderWidth: 0,
        }, styles.centered]}>
          <AlternatingContent
            style={{width:60, height:60, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <Icon name={'ios-warning'} size={40} color={'#fff'} style={{backgroundColor:'transparent'}} />,
              <Icon name={element.config.icon} size={35} color={'#fff'} />,
            ]}
          />
      </View>
      );
    }
    else if (((Util.versions.canUpdate(stone, state) === true) || Util.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false) && stone.reachability.disabled === false) {
      return (
        <View style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: colors.white.hex,
          borderWidth: 2,
          borderColor: color,
          justifyContent:'center', alignItems:'center'
        }, styles.centered]}>
          <AlternatingContent
            style={{width:60, height:60, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <Icon name={'c1-update-arrow'} size={44} color={color} style={{backgroundColor:'transparent'}} />,
              <Icon name={element.config.icon} size={35} color={color} />,
            ]} />
        </View>
      );
    }
    else {
      if (stone.reachability.disabled) {
        customStyle = {borderWidth:1, borderColor: colors.darkGray2.hex}
      }
      return (
        <AnimatedCircle size={60} color={color} style={customStyle}>
          <Icon name={element.config.icon} size={35} color={'#ffffff'} />
        </AnimatedCircle>
      );
    }
  }


  _getExplanationText(state) {
    let explanationStyle = { color: colors.iosBlue.hex, fontSize: 12}

    if (this.props.hideExplanation !== true && (this.props.locationId === null || state.app.hasSeenDeviceSettings === false)) {
      return (
        <SlideFadeInView height={15} visible={!this.state.showViaMesh}>
          <Text style={explanationStyle}>{ lang("Tap_me_for_more_") }</Text>
        </SlideFadeInView>
      );
    }
  }


  render() {
    let state = this.props.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let element = stone.config.applianceId ? state.spheres[this.props.sphereId].appliances[stone.config.applianceId] : stone;
    let useControl = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: ['rgba(255, 255, 255, 0.8)',  colors.csOrange.rgba(0.5)]
    });

    let WrapperElement = TouchableOpacity;
    if (this.props.touchable === false) {
      WrapperElement = View
    }

    return (
      <Animated.View style={[styles.listView,{flexDirection: 'column', height: this.state.height, overflow:'hidden', backgroundColor:backgroundColor}]}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <WrapperElement style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }}>
            {this._getIcon(element, stone, state)}
          </WrapperElement>
          <WrapperElement style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{element.config.name}</Text>
              <DeviceEntrySubText
                statusTextOverride={this.props.statusText}
                statusText={this.state.statusText}
                deviceType={stone.config.type}
                rssi={stone.reachability.rssi}
                disabled={stone.reachability.disabled}
                currentUsage={stone.state.currentUsage}
                nearestInSphere={this.props.nearestInSphere}
                nearestInRoom={this.props.nearestInRoom}
                tap2toggleThreshold={Util.data.getTapToToggleCalibration(state)}
                tap2toggleEnabled={state.app.tapToToggleEnabled}
              />
              { this._getExplanationText(state) }
              <SlideFadeInView height={15} visible={this.state.showViaMesh}>
                <Text style={{ color: colors.csOrange.hex, fontSize: 12}}>{ lang("Sent_via_mesh_") }</Text>
              </SlideFadeInView>
            </View>
          </WrapperElement>
          {useControl === true && Util.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) ? this._getControl(stone) : undefined}
        </View>
      </Animated.View>
    );
  }
}
