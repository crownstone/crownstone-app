import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import Camera from 'react-native-camera';
import { IconCircle }  from '../IconCircle'
import { PictureCircle }  from '../PictureCircle'
import {stylesIOS, colors} from '../../styles'
let styles = stylesIOS;

export class PictureEdit extends Component {
  render() {
      return (
        <View style={{flex:1}}>
          <View style={[styles.listView, {paddingTop:10, alignItems:'flex-start', height:this.props.barHeightLarge}]}>
            <Text style={styles.listText}>{this.props.label}</Text>
            {
              this.props.value !== undefined
                ?
                <TouchableOpacity onPress={this.props.removePicture} ><View><PictureCircle picture={{uri:this.props.value}} /></View></TouchableOpacity>
                :
                <TouchableOpacity onPress={this.props.triggerOptions}><View><IconCircle icon={'ios-camera-outline'} color='#ccc' showAdd={true} /></View></TouchableOpacity>
            }
          </View>
        </View>
      );
  }
}
