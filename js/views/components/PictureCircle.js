import React, { Component } from 'react'
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from './IconCircle'
import { LOGError } from '../../logging/Log'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { eventBus } from '../../util/eventBus'
import { preparePictureURI } from '../../util/util'
const Actions = require('react-native-router-flux').Actions;

export class PictureCircle extends Component {
  triggerOptions() {
    if (Platform.OS === 'android') {
      Alert.alert(
        "Sorry",
        "This function is not yet available on Android.",
        [{text: 'OK'}]
      );
      return;
    }

    // for iOS show the popup menu
    let buttons = [];
    buttons.push({ text: 'Take Picture', callback: () => { Actions.pictureView({selectCallback: this.props.callback});}});
    buttons.push({ text: 'Choose Existing', callback: () => { Actions.cameraRollView({selectCallback: this.props.callback});}});
    eventBus.emit('showPopup', buttons);
  }

  render() {
    let size = this.props.size || 60;
    if (this.props.value !== undefined && this.props.value !== null) {

      let imageURI = preparePictureURI(this.props.value);
      let borderWidth = size / 30;
      return (
        <TouchableOpacity onPress={this.props.removePicture} style={{height:size}}>
          <View>
            <View style={{width:size,
                  height:size,
                  borderRadius:size * 0.5,
                  backgroundColor: '#ffffff',
                  borderColor: '#fff',
                  borderWidth: borderWidth}}>
              <Image style={{
                  width:size-2*borderWidth,
                  height:size-2*borderWidth,
                  borderRadius:(size-2*borderWidth) * 0.5,
                  backgroundColor: '#ffffff',
                  }} source={{uri:imageURI}} />
                <View style={[{
                    marginTop:-size-1,
                    marginLeft:size*2/3 + 1,
                    width:size/3,
                    height:size/3,
                    borderRadius:size/6,
                    backgroundColor: colors.red.hex,
                    borderColor: '#ffffff',
                    borderWidth: size/30
                  }, styles.centered]}>
                <Icon name={'ios-remove'} size={size/5} color={'#ffffff'} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={{flexDirection:'row',alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity onPress={() => {this.triggerOptions()}} style={{height:size}}>
            <View>
              <IconCircle icon={'ios-camera-outline'} size={size} color='#ccc' showAdd={true} />
            </View>
          </TouchableOpacity>
          { this.props.placeholderText ?
            <Text style={{padding:10, color:colors.gray.hex, fontSize: 16}}>{this.props.placeholderText}</Text> :
            undefined}
        </View>
      );
    }
  }
}


/*
 // ANDROID SPECIFIC HANDLING OF PERMISSIONS
 if (Platform.OS === 'android') {
          PermissionsAndroid.checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA)
            .then((granted) => {
              // console.log('Has camera permission:', granted);
              if (granted === false) {
                return PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.CAMERA,
                  {'title': 'Crownstone', 'message': 'I need access to your camera to take a picture.'});
              }
            })
            .then((granted) => {
              // console.log('Granted camera permission:', granted);
              // granted can be undefined, when previous granted was true
              if (granted === false) {
                // console.log('Can\'t take a picture without permission!');
                //TODO Can't show alert here? Dunno why not
              }
              else {
                return PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                  {'title': 'Crownstone', 'message': 'I need access to your storage to take a picture.'});
                // Actions.pictureView({selectCallback: this.props.callback});
              }
            })
            .then((granted) => {
              // console.log('Granted read external storage:', granted);
              if (granted === true) {
                return PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                  {'title': 'Crownstone', 'message': 'I need access to your storage to take a picture.'});
              }
            })
            .then((granted) => {
              // console.log("Granted write external storage:", granted);
              if (granted === true) {
                Actions.pictureView({selectCallback: this.props.callback});
              }
            })
            .catch((err) => {
              LOGError("[PictureCircle.js] Error in checking camera permission:", err);
            })
        }
 else {
*/