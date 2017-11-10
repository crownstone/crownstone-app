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
import { styles, colors, screenWidth } from '../../styles'
import {AlternatingContent} from '../animated/AlternatingContent';
import {ALWAYS_DFU_UPDATE} from '../../../ExternalConfig';
import {STONE_TYPES} from '../../../router/store/reducers/stones';
import {BatchCommandHandler} from '../../../logic/BatchCommandHandler';
import {INTENTS} from '../../../native/libInterface/Constants';
import {Actions} from 'react-native-router-flux';
import {SetupStateHandler} from "../../../native/setup/SetupStateHandler";
import {LOG} from "../../../logging/Log";
import {StoneUtil} from "../../../util/StoneUtil";
import {IconButton} from "../IconButton";


export class DeviceEntry extends Component<any, any> {
  baseHeight : number;
  optionsHeight : number;
  openHeight : number;
  unsubscribe : any;
  optionsAreOpen : boolean;
  animating : boolean;
  id : string;
  initiallyOpenTimeout : any;
  optionMoveTimeout : any;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;
    this.optionsHeight = 40;
    this.openHeight = this.baseHeight + this.optionsHeight;
    this.unsubscribe = [];

    this.state = {height: new Animated.Value(this.baseHeight), optionsHeight:  new Animated.Value(0), optionsOpen: false, pendingCommand: false, backgroundColor: new Animated.Value(0)};
    this.optionsAreOpen = false;
    this.animating = false;
    this.id = Util.getUUID();
    this.initiallyOpenTimeout = undefined;
    this.optionMoveTimeout = undefined;
  }

  componentDidMount() {
    if (this.props.initiallyOpen) {
      this.initiallyOpenTimeout = setTimeout(() => { this._openOptions(600); }, 200);
    }

    this.unsubscribe.push(this.props.eventBus.on('focusDeviceEntry', (id) => {
      if (id !== this.id) {
        this._closeOptions();
      }
    }));

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

  _closeOptions(delay = 200) {
    if (this.optionsAreOpen === true && this.animating === false) {
      this.animating = true;
      this.setState({optionsOpen: false});
      Animated.timing(this.state.height, {toValue: this.baseHeight, duration: this.props.duration || delay}).start();
      Animated.timing(this.state.optionsHeight, {toValue: 0, duration: this.props.duration || delay}).start();
      this.optionMoveTimeout = setTimeout(() => {this.optionsAreOpen = false; this.animating = false;}, delay);
    }
  }

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

  _toggleOptions() {
    if (this.optionsAreOpen === false) {
      this._openOptions();
    }
    else {
      this._closeOptions();
    }
  }

  _pressedDevice(stone) {
    let newState = (stone.state.state === 1 ? 0 : 1);
    this.setState({pendingCommand:true});

    StoneUtil.switchBHC(
      this.props.sphereId,
      this.props.stoneId,
      stone, newState,
      this.props.store,
      {},
      () => { this.setState({pendingCommand:false});},
      INTENTS.manual,
      1,
      'from _pressedDevice in DeviceEntry'
    );
  }

  _getControl(stone) {
    let content;
    if (stone.config.disabled === false) {
      if (stone.errors.advertisementError) {
        content = <Switch value={stone.state.state === 1} disabled={true} />
      }
      else if (this.state.pendingCommand === true) {
        content = <ActivityIndicator animating={true} size='large' />;
      }
      else {
        content = <Switch value={stone.state.state === 1} onValueChange={() => { this._pressedDevice(stone); }}/>;
      }
    }

    return (
      <View style={{height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'}}>
        {content}
      </View>
    );
  }

  _iconPressed() {
    Actions.deviceOverview({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
  }

  _basePressed(stone) {
    if (stone.errors.hasError === true) {
      this.props.eventBus.emit('showResolveErrorOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId, stone: stone });
    }
    else {
      this._toggleOptions();
    }
  }

  _getIcon(element, stone, state) {
    let color = (
      stone.config.disabled === true ?
          colors.gray.hex :
          (stone.state.state > 0 ? colors.green.hex : colors.menuBackground.hex)
    );

    if (stone.errors.advertisementError === true) {
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
    else if ((Util.versions.canUpdate(stone, state) === true) && stone.config.disabled === false) {
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
        <View style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: color,
        }, styles.centered]}>
          <Icon name={element.config.icon} size={35} color={'#ffffff'} />
        </View>
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
              Actions.pop();
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
              Actions.deviceOverview({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
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
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}
                            onPress={() => { this._iconPressed(); }}>
            {this._getIcon(element, stone, state)}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => {
            this._basePressed(stone);
          }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{element.config.name}</Text>
              <DeviceEntrySubText
                rssi={stone.config.rssi}
                disabled={stone.config.disabled}
                currentUsage={stone.state.currentUsage}
                nearestInSphere={this.props.nearestInSphere}
                nearestInRoom={this.props.nearestInRoom}
                tap2toggleThreshold={Util.data.getTapToToggleCalibration(state)}
              />
            </View>
          </TouchableOpacity>
          {useControl === true ? this._getControl(stone) : undefined}
          {this.state.optionsOpen === true ? undefined :
            <View style={{position:'absolute', top: this.baseHeight-8, left: 0.5*screenWidth - 20 - 5, width:20, height:4, borderRadius:2, backgroundColor:colors.lightGray2.hex}} />
          }
        </View>
        {this._getOptions()}
      </Animated.View>
    );
  }
}


class DeviceEntrySubText extends Component<any, any> {
  render() {
    let currentUsage = this.props.currentUsage;
    let rssi = this.props.rssi;
    let disabled = this.props.disabled;

    if (disabled === false && currentUsage !== undefined) {
      // show it in orange if it's in tap to toggle range
      let color = colors.iosBlue.hex;
      if (this.props.tap2toggleThreshold && rssi >= this.props.tap2toggleThreshold) {
        color = colors.orange.hex;
      }

      if (this.props.nearestInSphere === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest)'}</Text>
          </View>
        )
      }
      else if (this.props.nearestInRoom === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest in room)'}</Text>
          </View>
        )
      }
      else if (rssi > -60) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Very near)'}</Text>
          </View>
        )
      }
      else if (rssi > -70) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
          </View>
        )
      }
      else {
        return <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
      }
    }
    else if (disabled === false) {
      if (this.props.nearest === true) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Nearest)'}</Text>
      }
      else if (rssi > -60) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Very near)'}</Text>
      }
      else if (rssi > -70) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
      }
    }
    else if (disabled === true) {
      return <Text style={{fontSize: 12}}>{
        SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...'
      }</Text>
    }
    else {
      return <View />
    }
  }
}