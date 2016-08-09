import React, { Component } from 'react'
import {
  
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from '../IconCircle'
import { styles, colors } from '../../styles'


export class IconEdit extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:this.props.barHeightLarge}]}>
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
