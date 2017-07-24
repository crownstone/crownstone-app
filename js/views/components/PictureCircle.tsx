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
import { LOG } from '../../logging/Log'
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
        <TouchableOpacity onPress={() => {
          Alert.alert("Delete this picture?", undefined, [{text:'No'}, {text:'Yes', onPress:() => {
            this.props.removePicture()
          }}])
        }} style={{height:size, width:size, position:'relative'}}>
            <Image style={{
                marginTop: 4,
                width:size-2*borderWidth,
                height:size-2*borderWidth,
                borderRadius:(size-2*borderWidth) * 0.5,
                backgroundColor: 'transparent',
                borderColor: '#ffffff',
                borderWidth: size/30
                }} source={{uri:imageURI}} />
            <View style={[{
                position: 'absolute',
                top: 0,
                right: 2,
                width:size/3,
                height:size/3,
                borderRadius:size/6,
                backgroundColor: colors.blue.hex,
                borderColor: '#ffffff',
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
          if (grantedPreviously === false) {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          }
          else {
            return PermissionsAndroid.RESULTS.GRANTED;
          }
        })
        .then((granted) => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return new Promise(
              (resolve,reject) => { 
                let reason = "Can't take a picture without permission!";
                Alert.alert(
                  "Sorry",
                  reason,
                  [{text: 'OK', onPress: () => { reject(reason) }}],
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
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return new Promise(
              (resolve,reject) => { 
                let reason = "Can\'t read a stored picture without permission!";
                Alert.alert(
                  "Sorry",
                  reason,
                  [{text: 'OK', onPress: () => { reject(reason) }}],
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
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return new Promise(
              (resolve,reject) => { 
                let reason = "Can\'t store a captured picture without permission!";
                Alert.alert(
                  "Sorry",
                  reason,
                  [{text: 'OK', onPress: () => { reject(reason) }}],
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
          LOG.error("PictureCircle: Error in checking camera permission:", err);
        })
    }
    else {
      // iOS doesn't care
    }
  }
}
