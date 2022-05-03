//
// import { Languages } from "../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("CameraRollView", key)(a,b,c,d,e);
// }
// import * as React from 'react'; import { Component } from 'react';
// import { NavigationUtil } from "../../util/navigation/NavigationUtil";
// import CameraRollPicker from 'react-native-camera-roll-picker';
// import { LiveComponent } from "../LiveComponent";
// import { colors, screenHeight, screenWidth } from "../styles";
// import { Background } from "../components/Background";
// import { Platform, View } from "react-native";
// import { TopbarImitation } from "../components/TopbarImitation";
// import { Icon } from "../components/Icon";
// import { FileUtil } from "../../util/FileUtil";
//
//
// export class CameraRollView extends LiveComponent<any, any> {
//   static options = {
//     topBar: { visible: false, height: 0 }
//   };
//
//   selected = false;
//
//   render() {
//    return (
//      <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
//        <Background fullScreen={true} hideNotifications={true} hideOrangeLine={true}  dimStatusBar={true}>
//          <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
//            <TopbarImitation
//              leftStyle={{color: colors.white.hex}}
//              left={Platform.OS === 'android' ? null : "Back"}
//              leftAction={() => { NavigationUtil.dismissModal(); }}
//              style={{backgroundColor:colors.black.hex, paddingTop:0}}
//              title={ lang("Select_your_Picture")}
//              rightAction={() => {
//                if (this.props.fromCameraView) {
//                  NavigationUtil.back();
//                }
//                else {
//                  NavigationUtil.navigate( 'PictureView',{selectCallback: this.props.selectCallback, fromCameraRollView: true, isSquare: this.props.isSquare});
//                }
//              }}
//              rightItem={
//                <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
//                  <Icon name={'ios-camera'} color={colors.white.hex} size={30} />
//                </View>
//              }
//            />
//            <CameraRollPicker
//              callback={(x) => {
//                // avoid double presses and wrong input.
//                if (x && Array.isArray(x) && x.length > 0 && x[0] && x[0].uri) {
//                  if (this.selected === false) {
//                    this.selected = true;
//                    FileUtil.copyCameraRollPictureToTempLocation(x[0])
//                      .then((uri) => {
//                        this.props.selectCallback(uri);
//                        NavigationUtil.dismissModal();
//                      })
//                  }
//                }
//              }}
//              selectSingleItem={true}
//              groupTypes={"All"}
//              imageMargin={2}
//              imagesPerRow={4}
//            />
//          </View>
//        </Background>
//      </View>
//    )
//   }
// }
