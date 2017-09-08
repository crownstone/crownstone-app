import * as React from 'react'; import { Component } from 'react';
import {
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth } from '../../styles'
import {Icon} from "../Icon";
import {Util} from "../../../util/Util";


export class DeletableEntry extends Component<any, any> {
  resetTimeout : any;
  id : string;
  unsubscribe : any;

  constructor() {
    super();
    this.state = {deleteActive:false};
    this.resetTimeout = undefined;
    this.id = Util.getUUID();
  }

  componentWillUnmount() {
    if (this.resetTimeout !== undefined) {
      clearTimeout(this.resetTimeout);
    }
  }

  _activateDeleteState() {
    if (this.resetTimeout !== undefined) {
      clearTimeout(this.resetTimeout);
    }
    this.setState({deleteActive: true});

    this.resetTimeout = setTimeout(() => {
      this.resetTimeout = undefined;
      this.setState({deleteActive:false});
    }, 1000);
  }


  _getDeleteIcon() {
    if (this.state.deleteActive) {
      return (
        <TouchableOpacity onPress={() => { this.props.callback() }} style={{width:30, alignItems:'center'}}>
          <Icon name="md-close-circle" size={30} color={colors.red.hex}/>
        </TouchableOpacity>
      )
    }
    else {
      return (
        <TouchableOpacity
          onPress={() => { this._activateDeleteState(); }}
          style={{width:30, alignItems:'center'}}
        >
          <Icon name="md-close-circle" size={23} color={this.props.deleteColor || colors.darkGray2.hex}/>
        </TouchableOpacity>
      )
    }
  }

  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = 75;
    else if (this.props.icon)
      barHeight = 50;
    return (
      <View style={[styles.listView, {height: barHeight, paddingRight: 5}, this.props.wrapperStyle]}>
        {this.props.largeIcon !== undefined ?
          <View style={[styles.centered, {width: 80, paddingRight:20} ]}>{this.props.largeIcon}</View> : undefined}
        {this.props.icon !== undefined ?
        <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
        {this.props.value !== undefined ?
          <Text numberOfLines={1} style={[styles.listText, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
          :
          <Text numberOfLines={1} style={[styles.listTextLarge, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
        }
        {this.props.value !== undefined ?
          <Text numberOfLines={1} style={[{flex:1, fontSize:16}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
          :
          <View style={{flex:1}} />
        }
        { this._getDeleteIcon() }
      </View>
    );
  }
}
