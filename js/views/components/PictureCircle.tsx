import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
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
import {LOG, LOGe} from '../../logging/Log'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { eventBus } from '../../util/EventBus'
import { preparePictureURI } from '../../util/Util'
const Actions = require('react-native-router-flux').Actions;

export class PictureCircle extends Component<any, any> {
  triggerOptions() {
    if (Platform.OS === 'android') {
      this.askForPermissions();
    } else {
      // for iOS show the popup menu
      this.showOptions();
    }
  }

  showOptions() {
    let buttons = [];
    if (Platform.OS === 'android') {
      buttons.push({ text: 'Take Photo', callback: () => { Actions.pictureView({selectCallback: this.props.callback});}});
      buttons.push({ text: 'Choose from Gallery', callback: () => { Actions.cameraRollView({selectCallback: this.props.callback});}});
    }
    else {
      buttons.push({ text: 'Take Picture', callback: () => { Actions.pictureView({selectCallback: this.props.callback, forceAspectRatio: this.props.forceAspectRatio});}});
      buttons.push({ text: 'Choose Existing', callback: () => { Actions.cameraRollView({selectCallback: this.props.callback});}});
    }
    eventBus.emit('showPopup', {title: Languages.title("PictureCircle", "Profile_Picture")(), buttons: buttons} );
  }

  render() {
    let size = this.props.size || 60;
    if (this.props.value !== undefined && this.props.value !== null) {
      let imageURI = preparePictureURI(this.props.value);
      let borderWidth = size / 30;
      let innerSize = size - 2*borderWidth;
      return (
        <TouchableOpacity
          onPress={() => { Alert.alert(
Languages.alert("PictureCircle", "_Delete_this_picture__arg_header")(),
Languages.alert("PictureCircle", "_Delete_this_picture__arg_body")(undefined),
[{text:Languages.alert("PictureCircle", "_Delete_this_picture__arg_left")()}, {
text:Languages.alert("PictureCircle", "_Delete_this_picture__arg_right")(), onPress:() => { this.props.removePicture(); }}])}}
          style={{
            height:size,
            width:size,
            borderRadius: 0.5*size,
            backgroundColor: colors.white.hex,
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Image style={{width:innerSize, height:innerSize, borderRadius:innerSize * 0.5, backgroundColor: 'transparent'}} source={{uri:imageURI}} />
            <View style={[{
                position: 'absolute',
                top: 0,
                right: 2,
                width:size/3,
                height:size/3,
                borderRadius:size/6,
                backgroundColor: colors.blue.hex,
                borderColor: colors.white.hex,
                borderWidth: size/30
              }, styles.centered]}>
                <Icon name={'md-remove'} size={size/5} color={'#ffffff'} />
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

  askForPermissions() {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
        .then((grantedPreviously) => {
          if (grantedPreviously === true || grantedPreviously === PermissionsAndroid.RESULTS.GRANTED) {
            return PermissionsAndroid.RESULTS.GRANTED;
          }
          else if (grantedPreviously === false || grantedPreviously === PermissionsAndroid.RESULTS.DENIED) {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          }
          else if (grantedPreviously === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            return new Promise(
              (resolve,reject) => {
                let reason =  Languages.label("PictureCircle", "Can_t_make_a_picture_with")();
                Alert.alert(
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_header")(),
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_body")(reason),
[{text: Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_left")(), onPress: () => { reject(reason) }}],
                  { onDismiss: () => { reject(reason) } }
                );
              }
            );
          }
          else {
            return PermissionsAndroid.RESULTS.GRANTED;
          }
        })
        .then((granted) => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
            return new Promise(
              (resolve,reject) => { 
                let reason =  Languages.label("PictureCircle", "Cant_take_a_picture_witho")();
                Alert.alert(
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_header")(),
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_body")(reason),
[{text: Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_left")(), onPress: () => { reject(reason) }}],
                  { onDismiss: () => { reject(reason) }}
                );
              }
            );
          }
          else {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          }
        })
        .then((granted) => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
            return new Promise(
              (resolve,reject) => { 
                let reason =  Languages.label("PictureCircle", "Can_t_read_a_stored_pictu")();
                Alert.alert(
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_header")(),
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_body")(reason),
[{text: Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_left")(), onPress: () => { reject(reason) }}],
                  { onDismiss: () => { reject(reason) } }
                );
              }
            );
          }
          else {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          }
        })
        .then((granted) => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
            return new Promise(
              (resolve,reject) => { 
                let reason =  Languages.label("PictureCircle", "Can_t_store_a_captured_pi")();
                Alert.alert(
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_header")(),
Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_body")(reason),
[{text: Languages.alert("PictureCircle", "_Sorry_arguments___OKnull_left")(), onPress: () => { reject(reason) }}],
                  { onDismiss: () => { reject(reason) } }
                );
              }
            );
          }
          else {
            this.showOptions();
          }
        })
        .catch((err) => {
          LOGe.info("PictureCircle: Error in checking camera permission:", err);
        })
    }
  }
}
