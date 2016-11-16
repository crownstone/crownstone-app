import React, { Component } from 'react' 
import {
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

import { Icon } from './Icon';
import Slider from 'react-native-slider'
import { IconButton } from '../components/IconButton'
import { getUUID } from '../../util/util'
import { styles, colors, screenWidth } from '../styles'


export class DeviceEntry extends Component {
  constructor(props) {
    super();

    this.baseHeight = props.height || 80;
    this.optionsHeight = 40;
    this.openHeight = this.baseHeight + this.optionsHeight;
    this.unsubscribe = () => {};

    this.state = {height: new Animated.Value(this.baseHeight), optionsOpen: false};
    this.optionsAreOpen = false;
    this.animating = false;
    this.id = getUUID();
  }

  componentDidMount() {
    if (this.props.initiallyOpen) {
      setTimeout(() => {this._openOptions(600);}, 200);
    }

    if (this.props.eventbus) {
      this.unsubscribe = this.props.eventBus.on("focusDeviceEntry", (id) => {
        if (id != this.id) {
          this._closeOptions();
        }
      })
    }
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe();
  }

  _closeOptions(delay = 200) {
    if (this.optionsAreOpen === true && this.animating === false) {
      this.animating = true;
      this.setState({optionsOpen: false});
      Animated.timing(this.state.height, {toValue: this.baseHeight, duration: this.props.duration || delay}).start();
      setTimeout(() => {this.optionsAreOpen = false; this.animating = false;}, delay);
    }
  }

  _openOptions(delay = 200) {
    if (this.optionsAreOpen === false && this.animating === false) {
      this.props.eventBus.emit("focusDeviceEntry", this.id);
      this.animating = true;
      this.setState({optionsOpen: true});
      Animated.timing(this.state.height, {toValue: this.openHeight, duration: this.props.duration || delay}).start();
      setTimeout(() => {this.optionsAreOpen = true; this.animating = false;}, delay);
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

  _pressedDevice() {
    this.props.onChange((this.props.state === 1 ? 0 : 1));
  }

  _getControl() {
    let content;
    if (this.props.disabled === false) {
      content = <Switch value={this.props.state === 1} onValueChange={this._pressedDevice.bind(this)} />
    }

    if (this.props.pending === true) {
      content = <ActivityIndicator animating={true} size="large" />
    }

    return (
      <View style={{height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'}}>
        {content}
      </View>
    );
  }

  _getIcon() {
    let color = (
      this.props.disabled === true ?
          colors.gray.hex :
          (this.props.state > 0 ? colors.green.hex : colors.menuBackground.hex)
    );

    let content = (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={this.props.icon} size={35} color={'#ffffff'} style={{position:'relative', top:2, backgroundColor:'transparent'}} />
      </View>
    );

    return content;
  }

  _getOptions() {
    if (this.state.optionsOpen || this.animating) {
      return (
        <View style={{height: this.optionsHeight, flex: 1, alignItems: 'center'}}>
          <View style={{height: 1, width: 0.9 * screenWidth, backgroundColor: '#dedede'}}/>
          <View style={{flexDirection: 'row', flex: 1, alignItems: "center"}}>
            <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => this.props.onMove()}>
              <Icon name="md-log-in" size={24} color="#aaa" style={{backgroundColor: 'transparent', position: 'relative'}}/>
            </TouchableOpacity>
            <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => this.props.onChangeType()}>
              <Icon name="ios-outlet" size={26} color="#aaa" style={{backgroundColor: 'transparent', position: 'relative', top: 1}}/>
            </TouchableOpacity>
            {this.props.showBehaviour === true ? <TouchableOpacity style={{flex: 1, alignItems: 'center'}} onPress={() => this.props.onChangeSettings()}>
              <Icon name="ios-cog" size={29} color="#aaa" style={{backgroundColor: 'transparent', position: 'relative', top: 1}}/>
            </TouchableOpacity> : undefined}
          </View>
        </View>
      )
    }
  }

  render() {
    return (
      <Animated.View style={{flexDirection: 'column', height: this.state.height,  flex: 1, overflow:'hidden'}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}
                            onPress={() => { this._toggleOptions(); }}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => {
            this._toggleOptions();
          }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{this.props.name}</Text>
              {this._getSubText()}
            </View>
          </TouchableOpacity>
          {this.props.navigation === true ? <Icon name="ios-arrow-forward" size={23} color={'#bababa'}/> : undefined}
          {this.props.control === true ? this._getControl() : undefined}
          {this.state.optionsOpen === true ? undefined :
            <View  style={{position:'absolute', top: this.baseHeight-8, left:0.5*screenWidth - 20 - 5, width:20, height:4, borderRadius:2, backgroundColor:colors.lightGray2.hex}} >
            </View>
          }
        </View>
        {this._getOptions()}
      </Animated.View>
    );
  }

  _getSubText() {
    if (this.props.disabled === false && this.props.currentUsage !== undefined) {
      return <Text style={{fontSize: 12}}>{this.props.currentUsage + ' W'}</Text>
    }
    else if (this.props.disabled === true && this.props.disabledDescription !== undefined) {
      return <Text style={{fontSize: 12}}>{this.props.disabledDescription}</Text>
    }
    else {
      return <View />
    }
  }
}