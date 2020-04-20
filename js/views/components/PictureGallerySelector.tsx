
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from './IconCircle'
import {LOGe} from '../../logging/Log'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";

import ImagePicker from 'react-native-image-picker';

export class PictureGallerySelector extends Component<any, any> {
  render() {
    let size = this.props.size || 60;
    if (this.props.value !== undefined && this.props.value !== null) {
      let imageURI = xUtil.preparePictureURI(this.props.value);
      let borderWidth = this.props.borderWidth || size / 30;
      let innerSize = size - 2.2*borderWidth;
      let width = size;
      let height = 0.75*width;
      let innerWidth = innerSize;
      let innerHeight = 0.73*innerWidth;
      let iconSize = size/3;
      return (
        <TouchableOpacity
          onPress={() => {
            this.props.removePicture();
            // Alert.alert(
            // lang("_Delete_this_picture__arg_header"),
            // lang("_Delete_this_picture__arg_body",undefined),
            // [{text:lang("_Delete_this_picture__arg_left")}, {
            // text:lang("_Delete_this_picture__arg_right"), onPress:() => { this.props.removePicture(); }}])}
          }}
          style={{
            height:height+0.3*iconSize,
            width:width+0.6*iconSize, overflow:"hidden"
          }}>
          <View style={{
            height:height,
            width:width,
            borderRadius: 10+borderWidth/2,
            marginTop:0.3*iconSize,
            marginLeft:0.3*iconSize,
            backgroundColor: colors.white.hex,
            alignItems:'center',
            justifyContent:'center',}}>
            <Image style={{width:innerWidth, height:innerHeight, borderRadius: 10, backgroundColor: 'transparent'}} source={imageURI} />
          </View>
          <View style={[{
            position:'absolute', right:0, top:0,
            width: iconSize,
            height:iconSize,
            borderRadius:iconSize*0.5,
            backgroundColor: colors.green.hex,
            borderColor: '#ffffff',
            borderWidth: borderWidth
          }, styles.centered]}>
            <Icon name={'md-create'} size={iconSize/2} color={'#ffffff'} />
          </View>
            {/*<View style={[{*/}
            {/*  position: 'absolute',*/}
            {/*  top: 0,*/}
            {/*  right: 2,*/}
            {/*  width:size/3,*/}
            {/*  height:size/3,*/}
            {/*  borderRadius:size/6,*/}
            {/*  backgroundColor: colors.blue.hex,*/}
            {/*  borderColor: colors.white.hex,*/}
            {/*  borderWidth: borderWidth*/}
            {/*  }, styles.centered]}>*/}
            {/*    <Icon name={'md-remove'} size={size/5} color={'#ffffff'} />*/}
            {/*</View>*/}
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={{flexDirection:'row',alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity onPress={() => { NavigationUtil.launchModal("ScenePictureGallery", {callback: this.props.callback })}} style={{height:size}}>
            <View>
              <IconCircle icon={'ios-images'} size={size} color='#ccc' showAdd={true} outerBorderWidth={2} />
            </View>
          </TouchableOpacity>
          { this.props.placeholderText ?
            <Text style={{padding:10, color:colors.gray.hex, fontSize: 16}}>{this.props.placeholderText}</Text> :
            undefined}
        </View>
      );
    }
  }

//   askForPermissions() {
//     if (Platform.OS === 'android') {
//       PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
//         .then((grantedPreviously : any) => {
//           if (grantedPreviously === true || grantedPreviously === PermissionsAndroid.RESULTS.GRANTED) {
//             return PermissionsAndroid.RESULTS.GRANTED;
//           }
//           else if (grantedPreviously === false || grantedPreviously === PermissionsAndroid.RESULTS.DENIED) {
//             return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
//           }
//           else if (grantedPreviously === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
//             return new Promise(
//               (resolve,reject) => {
//                 let reason =  lang("Can_t_make_a_picture_with");
//                 Alert.alert(
// lang("_Sorry_arguments___OKnull_header"),
// lang("_Sorry_arguments___OKnull_body",reason),
// [{text: lang("_Sorry_arguments___OKnull_left"), onPress: () => { reject(reason) }}],
//                   { onDismiss: () => { reject(reason) } }
//                 );
//               }
//             );
//           }
//           else {
//             return PermissionsAndroid.RESULTS.GRANTED;
//           }
//         })
//         .then((granted) => {
//           if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
//             return new Promise(
//               (resolve,reject) => {
//                 let reason =  lang("Cant_take_a_picture_witho");
//                 Alert.alert(
// lang("_Sorry_arguments___OKnull_header"),
// lang("_Sorry_arguments___OKnull_body",reason),
// [{text: lang("_Sorry_arguments___OKnull_left"), onPress: () => { reject(reason) }}],
//                   { onDismiss: () => { reject(reason) }}
//                 );
//               }
//             );
//           }
//           else {
//             return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
//           }
//         })
//         .then((granted) => {
//           if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
//             return new Promise(
//               (resolve,reject) => {
//                 let reason =  lang("Can_t_read_a_stored_pictu");
//                 Alert.alert(
//                   lang("_Sorry_arguments___OKnull_header"),
//                   lang("_Sorry_arguments___OKnull_body",reason),
//                   [{text: lang("_Sorry_arguments___OKnull_left"), onPress: () => { reject(reason) }}],
//                   { onDismiss: () => { reject(reason) } }
//                 );
//               }
//             );
//           }
//           else {
//             return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
//           }
//         })
//         .then((granted) => {
//           if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
//             return new Promise(
//               (resolve,reject) => {
//                 let reason =  lang("Can_t_store_a_captured_pi");
//                 Alert.alert(
//                   lang("_Sorry_arguments___OKnull_header"),
//                   lang("_Sorry_arguments___OKnull_body",reason),
//                   [{text: lang("_Sorry_arguments___OKnull_left"), onPress: () => { reject(reason) }}],
//                   { onDismiss: () => { reject(reason) } }
//                 );
//               }
//             );
//           }
//           else {
//             this.showOptions();
//           }
//         })
//         .catch((err) => {
//           LOGe.info("PictureCircle: Error in checking camera permission:", err);
//         })
//     }
//   }
}
