
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DoubleTapDelete", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { colors } from '../styles'
import {Icon} from "./Icon";
import {Util} from "../../util/Util";
import {IconButton} from "./IconButton";


export class DoubleTapDelete extends Component<any, any> {
  resetTimeout : any;
  unsubscribe : any;
  id : string;

  constructor(props) {
    super(props);
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
    }, 2000);
  }


  render() {
    if (this.state.deleteActive) {
      return (
        <TouchableOpacity
          key={this.id + 'active'}
          onPress={() => { this.props.callback() }}
          style={{height:50, width:50, alignItems:'center', justifyContent: 'center'}}
        >
          <IconButton
            name="ios-trash"
            size={23}
            buttonSize={28}
            radius={10}
            color="#fff"
            buttonStyle={{backgroundColor: colors.red.hex}}
          />
        </TouchableOpacity>
      )
    }
    else {
      return (
        <TouchableOpacity
          key={this.id + 'passive'}
          onPress={() => { this._activateDeleteState(); }}
          style={{height:50, width:50, alignItems:'center', justifyContent: 'center'}}
        >
          <Icon name="md-close-circle" size={23} color={this.props.deleteColor || colors.darkGray2.hex}/>
        </TouchableOpacity>
      )
    }
  }
}
