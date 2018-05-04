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
import { STONE_TYPES }                        from '../../../router/store/reducers/stones';
import { INTENTS }                            from '../../../native/libInterface/Constants';
import { Actions }                            from 'react-native-router-flux';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { DeviceEntrySubText }                 from "./DeviceEntrySubText";
import {AnimatedCircle} from "../animated/AnimatedCircle";


export class DeviceEntry extends Component<any, any> {
  baseHeight : number;
  unsubscribe = [];
  animating = false;
  id = Util.getUUID();

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;

    this.state = {
      height:          this.baseHeight,
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
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
      () => { this.setState({pendingCommand:false}); },
      INTENTS.manual,
      1,
      'from _pressedDevice in DeviceEntry'
    );
  }

  _getControl(stone) {
    let content;
    let action = null;
    if (stone.config.disabled === false) {
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
      stone.config.disabled === true ?
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
    else if (
      ((Util.versions.canUpdate(stone, state) === true) || Util.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false) &&
      stone.config.disabled === false) {
      return (
        <View style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: colors.white.hex,
          borderWidth: 2,
          borderColor: color,
        }, styles.centered]}>
          <AlternatingContent
            style={{flex:1, width:60, height:60, justifyContent:'center', alignItems:'center'}}
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
      if (stone.config.disabled) {
        customStyle = {borderWidth:1, borderColor: colors.darkGray2.hex}
      }
      return (
        <AnimatedCircle size={60} color={color} style={customStyle}>
          <Icon name={element.config.icon} size={35} color={'#ffffff'} />
        </AnimatedCircle>
      );
    }
  }

  render() {
    let state = this.props.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let element = stone.config.applianceId ? state.spheres[this.props.sphereId].appliances[stone.config.applianceId] : stone;
    let useControl = stone.config.type !== STONE_TYPES.guidestone;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: ['rgba(255, 255, 255, 0.8)',  colors.csOrange.rgba(0.5)]
    });

    return (
      <Animated.View style={[styles.listView,{flexDirection: 'column', height: this.state.height, overflow:'hidden', backgroundColor:backgroundColor}]}>
        {/*<DeviceCommandProgressBar {...this.props} pendingCommand={this.state.pendingCommand } baseHeight={this.baseHeight} updateStatusText={(text) => { this.setState({statusText: text}) }} />*/}
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }}>
            {this._getIcon(element, stone, state)}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{element.config.name}</Text>
              <DeviceEntrySubText
                statusText={this.state.statusText}
                rssi={stone.config.rssi}
                disabled={stone.config.disabled}
                currentUsage={stone.state.currentUsage}
                nearestInSphere={this.props.nearestInSphere}
                nearestInRoom={this.props.nearestInRoom}
                tap2toggleThreshold={Util.data.getTapToToggleCalibration(state)}
                tap2toggleEnabled={state.app.tapToToggleEnabled}
              />
            </View>
          </TouchableOpacity>
          {useControl === true && Util.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) ? this._getControl(stone) : undefined}
        </View>
      </Animated.View>
    );
  }
}
