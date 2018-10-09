
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeletableEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {styles, screenWidth, LARGE_ROW_SIZE, NORMAL_ROW_SIZE} from '../../styles'
import {Util} from "../../../util/Util";
import {DoubleTapDelete} from "../DoubleTapDelete";


export class DeletableEntry extends Component<any, any> {
  id: string;

  constructor(props) {
    super(props);

    this.id = Util.getUUID();
  }

  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = LARGE_ROW_SIZE;
    else if (this.props.icon)
      barHeight = NORMAL_ROW_SIZE;

    return (
      <View style={[styles.listView, {height: barHeight, paddingRight:0}, this.props.wrapperStyle]}>
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
        { <DoubleTapDelete key={this.id} callback={this.props.callback} /> }
      </View>
    );
  }
}
