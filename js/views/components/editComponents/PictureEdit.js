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
var Actions = require('react-native-router-flux').Actions;

import { IconCircle }  from '../IconCircle'
import { PictureCircle }  from '../PictureCircle'
import { styles, colors} from '../../styles'
import { eventBus } from '../../../util/eventBus'


export class PictureEdit extends Component {
  triggerOptions() {
    let buttons = [
      {text: 'Take Picture', callback: () => {Actions.pictureView({selectCallback:this.props.callback});}},
      {text: 'Choose Existing', callback: () => {Actions.cameraRollView({selectCallback:this.props.callback});}}
    ];
    eventBus.emit('showPopup', buttons);
  }

  render() {
      return (
        <View style={{flex:1}}>
          <View style={[styles.listView, {paddingTop:10, alignItems:'flex-start', height:this.props.barHeightLarge}]}>
            <Text style={styles.listText}>{this.props.label}</Text>
            {
              this.props.value !== undefined
                ?
                <TouchableOpacity onPress={this.props.removePicture} style={{height:60}}><View><PictureCircle picture={{uri:this.props.value}} /></View></TouchableOpacity>
                :
                <View style={{flexDirection:'row',alignItems:'center', justifyContent:'center'}}>
                  <TouchableOpacity onPress={() => {this.triggerOptions()}} style={{height:60}}>
                    <View>
                      <IconCircle icon={'ios-camera-outline'} color='#ccc' showAdd={true} />
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.listText ,{padding:10, color:colors.gray.h}]}>{this.props.placeholderText}</Text>
                </View>
            }
          </View>
        </View>
      );
  }
}
