import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { IconCircle }  from '../IconCircle'
import {stylesIOS, colors} from '../../styles'
let styles = stylesIOS;

export class PictureEdit extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:this.props.barHeightLarge}]}>
          <Text style={styles.listText}>{this.props.label}</Text>
          {this.props.value !== undefined ? <PictureCircle picture={require('../../../images/mediaRoom.png')} /> : <IconCircle icon={'ios-camera-outline'} color='#ccc' showAdd={true} />}
        </View>
      </View>
    );
  }
}