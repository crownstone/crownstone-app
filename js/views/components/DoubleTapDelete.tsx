import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { colors } from '../styles'
import {Icon} from "./Icon";
import {Util} from "../../util/Util";


export class DoubleTapDelete extends Component<any, any> {
  resetTimeout : any;
  unsubscribe : any;

  constructor() {
    super();
    this.state = {deleteActive:false};
    this.resetTimeout = undefined;
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


  render() {
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
}
