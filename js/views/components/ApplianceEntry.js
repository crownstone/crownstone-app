import React, { Component } from 'react' 
import {
  ActivityIndicatorIOS,
  Dimensions,
  Image,
  PixelRatio,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { getUUID } from '../../util/Util';
import { Icon } from './Icon';
import { styles, colors } from '../styles'


export class ApplianceEntry extends Component {
  constructor() {
    super();
    this.state = {deleteActive:false};
    this.resetTimeout = undefined;
    this.id = getUUID();
  }

  componentDidMount() {
    this.props.deleteEventBus.on("DELETE_TRIGGERED", (id) => {
      if (this.id !== id) {
        if (this.resetTimeout !== undefined) {
          clearTimeout(this.resetTimeout);
        }
        this.setState({deleteActive:false});
      }
    })
  }

  componentWillUnmount() {
    if (this.resetTimeout !== undefined) {
      clearTimeout(this.resetTimeout);
    }
  }

  _getDeleteIcon() {
    if (this.props.delete) {
      if (this.state.deleteActive) {
        return (
          <TouchableOpacity onPress={() => {this._doDelete();}} style={{width:40, alignItems:'center'}}>
            <Icon name="ios-close-circle" size={30} color={colors.red.hex}/>
          </TouchableOpacity>
        )
      }
      else {
        return (
          <TouchableOpacity
            onPress={() => {this._activateDeleteState();}}
            style={{width:40, alignItems:'center'}}
          >
            <Icon name="ios-close-circle" size={23} color={colors.gray.hex}/>
          </TouchableOpacity>
        )
      }
    }
  }

  _doDelete() {
    this.props.deleteEventBus.emit("DELETE_TRIGGERED", this.id);
    this.props.delete();
  }

  _activateDeleteState() {
    this.props.deleteEventBus.emit("DELETE_TRIGGERED", this.id);
    if (this.resetTimeout !== undefined) {
      clearTimeout(this.resetTimeout);
    }
    this.setState({deleteActive: true});

    this.resetTimeout = setTimeout(() => {
      this.resetTimeout = undefined;
      this.setState({deleteActive:false});
    }, 4000);
  }

  render() {
    let height = this.props.size + 20 || 60;
    let size = this.props.size || 60;

    return (
      <View style={{flexDirection:'row', height:height, paddingLeft:0, alignItems:'center', flex:1}}>
        <TouchableOpacity style={{paddingRight:20}} onPress={() => {this.props.select();}}>
          <View style={[{
              width: size,
              height: size,
              borderRadius: 0.5 * size,
              backgroundColor:  colors.blue.hex,
            }, styles.centered]}
          >
            <Icon name={this.props.icon} size={this.props.iconSize || size*0.6} color={'#ffffff'} style={{backgroundColor:'transparent'}} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={{flex:1, justifyContent:'center', height:0.8*height}} onPress={() => {this.props.select();}}>
          <Text style={{fontSize: 18, fontWeight: '300'}}>{this.props.name}</Text>
        </TouchableOpacity>
        {this._getDeleteIcon()}
      </View>
    );
  }
}