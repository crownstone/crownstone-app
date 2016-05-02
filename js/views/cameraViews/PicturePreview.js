import React, {
  Component,
  CameraRoll,
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { TopBar } from '../components/Topbar';
import Camera from 'react-native-camera';
var Icon = require('react-native-vector-icons/Ionicons');
var Actions = require('react-native-router-flux').Actions;
import { styles, colors} from '../styles'


let width = Dimensions.get('window').width;

export class PicturePreview extends Component {
  render() {
    return (
      <View style={{flex:1}} >
        <TopBar title="Review Your Picture" notBack={true} />
        <View style={{flex:1, backgroundColor:colors.menuBackground.h, alignItems:'center', justifyContent:'center'}}>
          {/*TODO: overlay must be added*/}
          <Image source={{uri:this.props.image}} width={width} height={width}>
            <View style={{position:'absolute', top:0, left:0, backgroundColor:'rgba(0,0,0,0.5)'}} width={width} height={width} />
            <Image source={{uri:this.props.image}} width={width} height={width} style={{position:'absolute', top:0, left:0, borderRadius:0.5*width}} />
          </Image>
          <View style={{flexDirection:'row', width:width, position:'absolute', bottom:0}}>
            <TouchableHighlight onPress={() => {Actions.pop(); Actions.pictureView({selectCallback:this.props.selectCallback});}} style={previewStyles.buttons}>
              <Text style={[styles.menuText,{fontWeight:'bold'}]}>Retake</Text>
            </TouchableHighlight>
            <TouchableHighlight onPress={() => {this.props.selectCallback(this.props.image); Actions.pop();}} style={[previewStyles.buttons,{alignItems:'flex-end'}]}>
              <Text style={[styles.menuText,{fontWeight:'bold'}]}>Use Picture</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    );
  }
}

const previewStyles = StyleSheet.create({
  buttons: {
    width:0.5*width,
    justifyContent:'center',
    alignItems:'flex-start',
    padding:20,
  }
});
