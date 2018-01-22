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
import { styles, colors, screenWidth }        from '../../styles'
import { AlternatingContent }                 from '../animated/AlternatingContent';
import { MINIMUM_REQUIRED_FIRMWARE_VERSION }  from '../../../ExternalConfig';
import { STONE_TYPES }                        from '../../../router/store/reducers/stones';
import { INTENTS }                            from '../../../native/libInterface/Constants';
import { Actions }                            from 'react-native-router-flux';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { BackAction }                         from "../../../util/Back";
import { DeviceCommandProgressBar }           from "./DeviceCommandProgressBar";
import { DeviceEntrySubText }                 from "./DeviceEntrySubText";
import {AnimatedCircle} from "../animated/AnimatedCircle";


export class DeviceEntry extends Component<any, any> {
  baseHeight : number;
  optionsHeight : number;
  openHeight : number;
  unsubscribe = [];
  optionsAreOpen = false;
  animating = false;
  id = Util.getUUID();
  initiallyOpenTimeout : any;
  optionMoveTimeout : any;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;
    this.optionsHeight = 40;
    this.openHeight = this.baseHeight + this.optionsHeight;

    this.state = {
      height:          new Animated.Value(this.baseHeight),
      optionsHeight:   new Animated.Value(0),
      optionsOpen:     false,
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
    };
  }

  componentDidMount() {
    if (this.props.initiallyOpen) {
      this.initiallyOpenTimeout = setTimeout(() => { this._openOptions(600); }, 200);
    }

    // this event will close the options if another crownstone entry opens their options. This makes sure only one options field is open at any given time.
    this.unsubscribe.push(this.props.eventBus.on('focusDeviceEntry', (id) => {
      if (id !== this.id) {
        this._closeOptions();
      }
    }));

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

  componentWillUpdate(nextProps, nextState) {
    // If the component is already mounted and it gets a new set of props that want it to be initially open,
    // we open it if it is not already open, opening or already initiallyOpen
    if (
      this.props.initiallyOpen !== nextProps.initiallyOpen &&
      nextProps.initiallyOpen === true &&
      this.state.optionsOpen === false &&
      this.animating === false
       ) {
      this._openOptions(600);
    }
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    clearTimeout(this.initiallyOpenTimeout);
    clearTimeout(this.optionMoveTimeout);
  }


  /**
   *  Close the options of the Crownstone device entry
   */
  _closeOptions(delay = 200) {
    if (this.optionsAreOpen === true && this.animating === false) {
      this.animating = true;
      this.setState({optionsOpen: false});
      Animated.timing(this.state.height, {toValue: this.baseHeight, duration: this.props.duration || delay}).start();
      Animated.timing(this.state.optionsHeight, {toValue: 0, duration: this.props.duration || delay}).start();
      this.optionMoveTimeout = setTimeout(() => {this.optionsAreOpen = false; this.animating = false;}, delay);
    }
  }


  /**
   *  Open the options of the Crownstone device entry
   */
  _openOptions(delay = 200) {
    if (this.optionsAreOpen === false && this.animating === false) {
      this.props.eventBus.emit('focusDeviceEntry', this.id);
      this.animating = true;
      this.setState({optionsOpen: true});
      Animated.timing(this.state.height, {toValue: this.openHeight, duration: this.props.duration || delay}).start();
      Animated.timing(this.state.optionsHeight, {toValue: this.optionsHeight, duration: this.props.duration || delay}).start();
      this.optionMoveTimeout = setTimeout(() => {this.optionsAreOpen = true; this.animating = false;}, delay);
    }
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
      {keepConnectionOpen: false, keepConnectionOpenTimeout: 2},
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
        content = <Switch value={stone.state.state === 1} disabled={true} />
        action = () => { this._basePressed(stone); }
      }
      else if (stone.config.locked) {
        content = <Icon name={'md-lock'} color={colors.black.rgba(0.2)} size={32} />
        action = () => { this._basePressed(stone); }
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

  _basePressed(stone, allowToggleOptions = true) {
    if (stone.errors.hasError === true || stone.config.locked || allowToggleOptions === false) {
      Actions.deviceOverview({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
    }
    else {
      if (this.optionsAreOpen === false) {
        this._openOptions();
      }
      else {
        this._closeOptions();
      }
    }
  }

  _getIcon(element, stone, state) {
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
      return (
        <AnimatedCircle size={60} color={color}>
          <Icon name={element.config.icon} size={35} color={'#ffffff'} />
        </AnimatedCircle>
      );
    }
  }

  _getOptions() {
    let textStyle = {fontSize:14, padding:5, color: colors.darkGray2.hex, paddingBottom:7};
    let buttonStyle = {flex: 1, paddingLeft:12, paddingRight:12, height: 35, alignItems: 'center', justifyContent:'center', flexDirection:'row'};

    if (this.state.optionsOpen || this.animating) {
      return (
        <Animated.View style={{height: this.state.optionsHeight, width: screenWidth, alignItems: 'center', overflow: 'hidden'}}>
          <View style={{height: 1, width: 0.9 * screenWidth, backgroundColor: '#dedede'}}/>
          <View style={{height: this.optionsHeight-1, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity style={buttonStyle} onPress={() => {
              BackAction();
              Actions.roomSelection({
                sphereId: this.props.sphereId,
                stoneId: this.props.stoneId,
                locationId: this.props.locationId,
                viewingRemotely: this.props.viewingRemotely
              });
            }}>
              <Icon name='md-log-in' size={24} color='#aaa' style={{backgroundColor: 'transparent', position: 'relative'}}/>
              <Text style={textStyle}>move</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[buttonStyle, {justifyContent:'center'}]} onPress={() => {
              Actions.deviceOverview({
                sphereId: this.props.sphereId,
                stoneId: this.props.stoneId,
                viewingRemotely: this.props.viewingRemotely
              });
            }}>
              <Icon name='ios-cog' size={29} color='#aaa' style={{backgroundColor: 'transparent', position: 'relative', top: 1}}/>
              <Text style={textStyle}>settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )
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
        <DeviceCommandProgressBar {...this.props} pendingCommand={this.state.pendingCommand } baseHeight={this.baseHeight} updateStatusText={(text) => { this.setState({statusText: text}) }} />
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(stone, false); }}>
            {this._getIcon(element, stone, state)}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(stone); }}>
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
          {this.state.optionsOpen === true ? undefined :
            <View style={{position:'absolute', top: this.baseHeight-8, left: 0.5*screenWidth - 20 - 5, width:20, height:4, borderRadius:2, backgroundColor:colors.lightGray2.hex}} />
          }
        </View>
        {this._getOptions()}
      </Animated.View>
    );
  }
}
