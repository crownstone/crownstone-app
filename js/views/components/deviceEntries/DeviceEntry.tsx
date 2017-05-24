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

import { Icon } from '../Icon';
import { Util } from '../../../util/Util'
import { styles, colors, screenWidth } from '../../styles'
import {AlternatingContent} from '../animated/AlternatingContent';
import {ALWAYS_DFU_UPDATE} from '../../../ExternalConfig';
import {stoneTypes} from '../../../router/store/reducers/stones';
import {BatchCommandHandler} from '../../../logic/BatchCommandHandler';
import {INTENTS} from '../../../native/libInterface/Constants';
import {Actions} from 'react-native-router-flux';
import {SetupStateHandler} from "../../../native/setup/SetupStateHandler";


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
    super();

    this.baseHeight = props.height || 80;
    this.optionsHeight = 40;
    this.openHeight = this.baseHeight + this.optionsHeight;
    this.unsubscribe = () => {};

    this.state = {height: new Animated.Value(this.baseHeight), optionsHeight:  new Animated.Value(0), optionsOpen: false, pendingCommand: false};
    this.optionsAreOpen = false;
    this.animating = false;
    this.id = Util.getUUID();
    this.initiallyOpenTimeout = undefined;
    this.optionMoveTimeout = undefined;
  }

  componentDidMount() {
    if (this.props.initiallyOpen) {
      this.initiallyOpenTimeout = setTimeout(() => {this._openOptions(600);}, 200);
    }

    this.unsubscribe = this.props.eventBus.on('focusDeviceEntry', (id) => {
      if (id != this.id) {
        this._closeOptions();
      }
    })
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
    this.unsubscribe();
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
    let data = {state: newState};
    if (newState === 0) {
      data['currentUsage'] = 0;
    }

    BatchCommandHandler.loadPriority(
      stone,
      this.props.stoneId,
      this.props.sphereId,
      {commandName:'multiSwitch', state: newState, intent: INTENTS.manual, timeout: 0}
    )
      .then(() => {
        this.props.store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE',
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: data
        });
        this.setState({pendingCommand:false});
      })
      .catch((err) => {
        this.setState({pendingCommand:false});
      });

    BatchCommandHandler.executePriority();
  }

  _getControl(stone) {
    let content;
    if (stone.config.disabled === false) {
      content = <Switch value={stone.state.state === 1} onValueChange={() => { this._pressedDevice(stone); }} />
    }

    if (this.state.pendingCommand === true) {
      content = <ActivityIndicator animating={true} size='large' />
    }

    return (
      <View style={{height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'}}>
        {content}
      </View>
    );
  }

  _canUpdate(stone,state) {
    let firmwareVersionsAvailable = state.user.firmwareVersionsAvailable || {};
    return Util.versions.isLower(stone.config.firmwareVersion, firmwareVersionsAvailable[stone.config.hardwareVersion]);
  }

  _iconPressed(stone, state) {
    if (stone.errors.hasError === true) {
      Alert.alert('An error has been detected', 'I\'m currently trying to ask this Crownstone what it is. An overlay should appear shortly', [{text:'OK'}]);
      return;
    }

    if ((this._canUpdate(stone, state) === true || ALWAYS_DFU_UPDATE) && stone.config.disabled === false) {
      this.props.eventBus.emit('updateCrownstoneFirmware', {stoneId: this.props.stoneId, sphereId: this.props.sphereId});
    }
    else {
      this._toggleOptions();
    }
  }

  _getIcon(element, stone, state) {
    let color = (
      stone.config.disabled === true ?
          colors.gray.hex :
          (this.props.state > 0 ? colors.green.hex : colors.menuBackground.hex)
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
            style={{flex:1, width:60, height:60, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <Icon name={'ios-warning'} size={40} color={'#fff'} style={{position:'relative', top:-1, backgroundColor:'transparent'}} />,
              <Icon name={element.config.icon} size={35} color={'#fff'} style={{position:'relative', backgroundColor:'transparent'}} />,
            ]}
          />
      </View>
      );
    }
    else if ((this._canUpdate(stone, state) === true || ALWAYS_DFU_UPDATE) && stone.config.disabled === false) {
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
              <Icon name={'c1-update-arrow'} size={44} color={color} style={{position:'relative', top:-1, left:0, backgroundColor:'transparent'}} />,
              <Icon name={element.config.icon} size={35} color={color} style={{position:'relative', backgroundColor:'transparent'}} />,
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
          <Icon name={element.config.icon} size={35} color={'#ffffff'} style={{position:'relative', backgroundColor:'transparent'}} />
        </View>
      );
    }


  }

  _getOptions(showBehaviour : boolean = true) {
    if (this.state.optionsOpen || this.animating) {
      return (
        <Animated.View style={{height: this.state.optionsHeight, width: screenWidth, alignItems: 'center', overflow: 'hidden'}}>
          <View style={{height: 1, width: 0.9 * screenWidth, backgroundColor: '#dedede'}}/>
          <View style={{flexDirection: 'row', flex: 1, alignItems: 'center'}}>
            <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => {
              Actions.pop();
              (Actions as any).roomSelection({
                sphereId: this.props.sphereId,
                stoneId: this.props.stoneId,
                locationId: this.props.locationId,
                viewingRemotely: this.props.viewingRemotely
              });
            }}>
              <Icon name='md-log-in' size={24} color='#aaa' style={{backgroundColor: 'transparent', position: 'relative'}}/>
            </TouchableOpacity>
            <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => {
              (Actions as any).deviceEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely});
            }}>
              <Icon name='ios-outlet' size={26} color='#aaa' style={{backgroundColor: 'transparent', position: 'relative', top: 1}}/>
            </TouchableOpacity>
              {showBehaviour === true ? <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => {
                (Actions as any).deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
              }}>
              <Icon name='ios-cog' size={29} color='#aaa' style={{backgroundColor: 'transparent', position: 'relative', top: 1}}/>
            </TouchableOpacity> : undefined}
          </View>
        </Animated.View>
      )
    }
  }

  render() {
    let state = this.props.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    let element = stone.config.applianceId ? state.spheres[this.props.sphereId].appliances[stone.config.applianceId] : stone;
    let useControl = stone.config.type !== stoneTypes.guidestone;

    return (
      <Animated.View style={{flexDirection: 'column', height: this.state.height,  flex: 1, overflow:'hidden'}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}
                            onPress={() => { this._iconPressed(stone, state); }}>
            {this._getIcon(element, stone, state)}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => {
            this._toggleOptions();
          }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{element.config.name}</Text>
              {this._getSubText(stone, state)}
            </View>
          </TouchableOpacity>
          {useControl === true ? this._getControl(stone) : undefined}
          {this.state.optionsOpen === true ? undefined :
            <View style={{position:'absolute', top: this.baseHeight-8, left: 0.5*screenWidth - 20 - 5, width:20, height:4, borderRadius:2, backgroundColor:colors.lightGray2.hex}} />
          }
        </View>
        {this._getOptions(useControl)}
      </Animated.View>
    );
  }

  _getSubText(stone, state) {
    if (stone.config.disabled === false && stone.state.currentUsage !== undefined) {
      // show it in orange if it's in tap to toggle range
      let color = colors.iosBlue.hex;
      let tap2toggleThreshold = Util.data.getTapToToggleCalibration(state);
      let currentUsage = stone.state.currentUsage;
      if (tap2toggleThreshold && stone.config.rssi >= tap2toggleThreshold) {
        color = colors.orange.hex;
      }

      if (this.props.nearest === true && stone.config.rssi > -70) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest)'}</Text>
          </View>
        )
      }
      else if (stone.config.rssi > -60) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Very near)'}</Text>
          </View>
        )
      }
      else if (stone.config.rssi > -70) {
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
    else if (stone.config.disabled === false) {
      if (this.props.nearest === true) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Nearest)'}</Text>
      }
      else if (stone.config.rssi > -60) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Very near)'}</Text>
      }
      else if (stone.config.rssi > -70) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
      }
    }
    else if (stone.config.disabled === true) {
      return <Text style={{fontSize: 12}}>{
        SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...'
      }</Text>
    }
    else {
      return <View />
    }
  }
}
