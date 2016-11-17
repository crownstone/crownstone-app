import React, { Component } from 'react' 
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

import { SetupStateHandler } from '../../native/SetupStateHandler'
import { Icon } from './Icon';
import { styles, colors, screenWidth } from '../styles'
import { BLEutil, SetupCrownstone } from '../../native/BLEutil'
import { LOG, LOGDebug, LOGError } from '../../logging/Log'


export class SetupDeviceEntry extends Component {
  constructor(props) {
    super();

    this.baseHeight = props.height || 80;
    this.unsubscribe = () => {};

    this.props = props;
    this.state = {
      progressWidth: new Animated.Value(0),
      name: this.props.item.name,
      explanation:'',
      subtext: 'Click here to add it to this Sphere!',
      disabled: false,
      setupInProgress: false
    };

    this.currentLoadingWidth = 0;
    this.setupEvents = [];
  }

  componentDidMount() {
    this.setupEvents.push(this.props.eventBus.on("setupCancelled", (handle) => {
      if (this.props.handle === handle) {
        this.setProgress(0);
      }
      else {
        this.setProgress(0);
      }
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
    this.unsubscribe();
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
        <Icon name={this.props.item.icon} size={35} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
      </View>
    );
  }


  setProgress(value = 0) {
    switch(value) {
      case -1:
        this.setState({explanation:'Another Crownstone is already pairing.', subtext:'Pairing in progress...', setupInProgress:false, disabled: true});
        break;
      case 0:
        this.setState({explanation:'', subtext:'Click here to add it to this Sphere!', disabled: false, setupInProgress: false});
        break;
      case 1:
        this.setState({subtext:"Claiming... Please stay close!", explanation:'', setupInProgress: true});
        break;
      case 3:
        this.setState({explanation:"Registering in the Cloud...", setupInProgress: true});
        break;
      case 4:
        this.setState({explanation:"Setting up Crownstone...", setupInProgress: true});
        break;
      case 19:
        this.setState({subtext:"Finalizing setup...", explanation:"Rebooting Crownstone..."});
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
              <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
              <Text style={{fontSize: 10}}>{this.state.explanation}</Text>
            </View>
          </TouchableOpacity>
          {this._getActivityIndicator()}
        </View>
        <Animated.View style={{position:'relative', left:-15, top:-loadingHeight, width: this.state.progressWidth, height:loadingHeight, backgroundColor:colors.green2.hex}} />
      </View>
    );
  }

  setupStone() {
    if (this.state.disabled === false && this.state.setupInProgress !== true) {
      SetupStateHandler.setupStone(this.props.handle, this.props.sphereId);
    }
  }
}