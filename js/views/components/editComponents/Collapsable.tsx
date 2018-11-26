
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Collapsable", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from '../Icon';
import { styles, colors, screenWidth} from '../../styles'
import {Util} from "../../../util/Util";
import {eventBus} from "../../../util/EventBus";
import {SlideInView} from "../animated/SlideInView";
import {Separator} from "../Separator";


export class CollapsableBar extends Component<any, any> {
  unsubscribe = [];
  uuid = Util.getUUID();

  constructor(props) {
    super(props);

    this.state = { open: false };
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on('expandFAQQuestion', (id) => {
      if (id !== this.uuid && this.state.open === true) {
        this.setState({open: false});
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  _handleClick() {
    if (this.state.open === true) {
      this.setState({open: false});
    }
    else {
      eventBus.emit("expandFAQQuestion", this.uuid);
      this.setState({open: true});
    }
  }

  render() {
    let paddingAmount = 15;
    let labelStyle = {paddingTop:paddingAmount, paddingBottom:paddingAmount};

    return (
      <TouchableHighlight onPress={() => { this._handleClick() }}>
        <View>
          <View style={[styles.listView, {flex: 1}]}>
            {this.props.largeIcon !== undefined ? <View style={[styles.centered, {width: 80, paddingRight: 20}]}>{this.props.largeIcon}</View> : undefined}
            {this.props.mediumIcon !== undefined ? <View style={[styles.centered, {width: 0.15 * screenWidth, paddingRight: 15}]}>{this.props.mediumIcon}</View> : undefined}
            {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}

            {this.props.value !== undefined && this.props.valueRight !== true ?
              <Text style={[styles.listText, labelStyle, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
              :
              <Text style={[styles.listTextLarge, labelStyle, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
            }
            <View style={{paddingTop:3}}>
              {this.state.open === true ? <Icon name="ios-arrow-down" size={18} color={'#888'} style={{paddingLeft:5}} /> : <Icon name="ios-arrow-forward" size={18} color={'#888'} style={{paddingLeft:5}} />}
            </View>
          </View>
          <SlideInView visible={this.state.open} height={this.props.contentHeight || 100} duration={200} style={{backgroundColor: colors.white.hex }}>
            <Separator fullLength={true} color={colors.black.rgba(0.15)}/>
            {this.props.contentItem ? this.props.contentItem : <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}} allowFontScaling={false}>{this.props.content}</Text>}
          </SlideInView>
        </View>
      </TouchableHighlight>
    );
  }
}
