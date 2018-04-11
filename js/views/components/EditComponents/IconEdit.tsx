import * as React from 'react'; import { Component } from 'react';
import {
  
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from '../IconCircle'
import { styles} from '../../styles'


export class IconEdit extends Component<any, any> {
  render() {
    return (
      <View style={{height: this.props.barHeightLarge}}>
        <View style={[styles.listView, { paddingTop:10, alignItems:'flex-start', height:this.props.barHeightLarge}]}>
          <Text style={styles.listText}>{this.props.label}</Text>
          <TouchableOpacity onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
            <View>
              <IconCircle icon={this.props.value} showEdit={true} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}