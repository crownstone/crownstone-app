
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ApplianceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
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

import { Util } from '../../util/Util';
import { Icon } from './Icon';
import { styles, colors } from '../styles'
import {DoubleTapDelete} from "./DoubleTapDelete";


export class ApplianceEntry extends Component<any, any> {
  id : string;

  constructor(props) {
    super(props);
    this.id = Util.getUUID();
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
        <TouchableOpacity style={{flex:1, flexDirection:'row', alignItems:'center', height:0.8*height}} onPress={() => {this.props.select();}}>
          <Text style={{fontSize: 18, fontWeight: '300'}}>{this.props.name}</Text>
          { this.props.current ? <Text style={{fontSize: 15, fontWeight: '100', color: colors.blue.hex, position:'relative', top:1, paddingLeft:5}}>{ lang("_current_") }</Text> : undefined }
        </TouchableOpacity>
        { this.props.delete ? <DoubleTapDelete key={this.id} callback={this.props.delete} /> : undefined }
      </View>
    );
  }
}