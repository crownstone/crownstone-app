
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { Image, TouchableOpacity, StyleSheet, Text, View, Platform, ViewStyle } from "react-native";

import { RNCamera } from 'react-native-camera';

import { colors, screenWidth, screenHeight, availableModalHeight, styles, tabBarMargin, topBarHeight } from "../styles";

import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";
import { FileUtil } from "../../util/FileUtil";
import { isQualifiedTypeIdentifier } from "@babel/types";

export class PictureView extends Component<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  camera;
  cleaningUp = false;

  constructor(props) {
    super(props);

    this.state = {
      cameraType: RNCamera.Constants.Type.back,
      flashMode: RNCamera.Constants.FlashMode.auto,
      picture: null,
    }
  }


  cleanup(changeState = false) {
    if (this.state.picture && this.cleaningUp === false) {
      this.cleaningUp = true;
      FileUtil.safeDeleteFile(this.state.picture)
        .then(() => {
          this.cleaningUp = false;
          if (changeState !== false) {
            this.setState({ picture: null });
          }
        })
        .catch((err) => {
          this.cleaningUp = false;
        })
    }
  }

  render() {
    // somehow the camera does not take full screen size.
    let buttonSize = Math.min(60,0.18 * screenWidth);

    // has aspect ratio
    let isSquare = this.props.isSquare === true;
    let bottomPadding = 15;
    let bottomHeight = buttonSize + 2*bottomPadding + tabBarMargin;

    let bottomStyle : ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      padding: bottomPadding,
      paddingHorizontal: 20,
      flexDirection:'row',
      height: bottomHeight,
      width: screenWidth,
      paddingBottom: tabBarMargin,
      backgroundColor: colors.black.hex,
    };

    let maxSquarePictureHeight = screenHeight - topBarHeight - bottomHeight;

    if (!isSquare) {
      bottomStyle['position'] = 'absolute';
      bottomStyle['bottom'] = 0;
    }

    if (this.state.picture) {
      return (
        <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
          <Background fullScreen={true} hideOrangeBar={true} dimStatusBar={true}>
            <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
              <TopbarImitation
                leftStyle={{color: colors.white.hex}}
                left={Platform.OS === 'android' ? null : "Back"}
                leftAction={() => { this.cleanup(); NavigationUtil.dismissModal(); }}
                style={{backgroundColor:colors.black.hex, paddingTop:0}}
                title={"Did it go well?"}
              />
              <View style={{width: screenWidth, height: 2, backgroundColor: colors.csOrange.hex }} />
              <View style={{flex:1}} />
              <Image
                source={{uri:this.state.picture}}
                style={{
                  width: screenWidth,
                  height: isSquare ? Math.min(screenWidth, maxSquarePictureHeight) : screenHeight,
                }}
              />
              <View style={{flex:1}} />
              <View style={bottomStyle}>
                <TouchableOpacity
                  style={{alignItems:'center', justifyContent:'center'}}
                  onPress={() => { this.cleanup(true); }}
                >
                  <Text style={{fontSize:16, color:colors.white.hex}}>{"Retry"}</Text>
                </TouchableOpacity>
                <View style={{flex:1}} />
                <TouchableOpacity
                  style={{alignItems:'center', justifyContent:'center'}}
                  onPress={() => {
                    this.props.selectCallback(this.state.picture);
                    NavigationUtil.dismissModal();
                  }}
                >
                  <Text style={{fontSize:16, color:colors.white.hex}}>{"Done"}</Text>
                </TouchableOpacity>
              </View>
              <View style={{height:tabBarMargin, width:screenWidth}} />
            </View>
          </Background>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
          <Background fullScreen={true} hideOrangeBar={true} dimStatusBar={true}>
            <View style={{flex:1, width: screenWidth, height: screenHeight, backgroundColor:colors.black.hex}}>
              <TopbarImitation
                leftStyle={{color: colors.white.hex}}
                left={Platform.OS === 'android' ? null : "Back"}
                leftAction={() => { NavigationUtil.dismissModal(); }}
                style={{backgroundColor:colors.black.hex, paddingTop:0}}
                title={"Take a Picture"}
                rightAction={() => {
                  this.cleanup();
                  if (this.props.fromCameraRollView) {
                    NavigationUtil.back();
                  }
                  else {
                    NavigationUtil.navigate( 'CameraRollView',{selectCallback: this.props.selectCallback, fromCameraView: true, isSquare: this.props.isSquare});
                  }
                }}
                rightItem={
                  <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
                    <Icon name={'md-images'} color={colors.white.hex} size={30} />
                  </View>
                }
              />
              <View style={{width: screenWidth, height: 2, backgroundColor: colors.csOrange.hex }} />
              <View style={{flex:1}} />
              <RNCamera
                ref={ref => {
                  this.camera = ref;
                }}
                captureAudio={false}
                style={{
                  width: screenWidth,
                  height: isSquare ? screenWidth : screenHeight,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
                type={this.state.cameraType}
                flashMode={this.state.flashMode}
                androidCameraPermissionOptions={{
                  title: 'Permission to use camera',
                  message: 'We need your permission to use your camera',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
                androidRecordAudioPermissionOptions={{
                  title: 'Permission to use audio recording',
                  message: 'We need your permission to use your audio',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
                // onGoogleVisionBarcodesDetected={({ barcodes }) => {
                //   console.log(barcodes);
                // }}
              />
              <View style={{flex:1}} />
              <View style={bottomStyle}>
                <View style={{alignItems:'center', justifyContent:'center'}}>{this.getFlashIcon()}</View>
                <View style={{flex:1}} />
                <TouchableOpacity onPress={this.takePicture.bind(this)} style={{backgroundColor: '#fff', width: buttonSize, height: buttonSize, borderRadius: 0.5*buttonSize, ...styles.centered}}>
                  <View   style={{width:buttonSize - 6,  height: buttonSize - 6,  borderRadius: 0.5*(buttonSize - 6),  backgroundColor:'#000', ...styles.centered}}>
                    <View style={{width:buttonSize - 12, height: buttonSize - 12, borderRadius: 0.5*(buttonSize - 12), backgroundColor:'#fff'}} />
                  </View>
                </TouchableOpacity>
                <View style={{flex:1}} />
                <TouchableOpacity
                  style={{alignItems:'center', justifyContent:'center'}}
                  onPress={() => {
                    let newType = RNCamera.Constants.Type.back;
                    if (this.state.cameraType === newType) {
                      newType = RNCamera.Constants.Type.front
                    }
                    this.setState({cameraType:newType})
                  }}
                >
                  <Icon name={'ios-reverse-camera'} color={colors.white.hex} size={40} />
                </TouchableOpacity>
              </View>
              <View style={{height:tabBarMargin, width:screenWidth}} />
            </View>
          </Background>
        </View>
      );
    }

  }

  takePicture = async() => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const data = await this.camera.takePictureAsync(options);
      this.setState({picture: data.uri})
    }
  };

  getFlashIcon() {
    switch (this.state.flashMode) {
      case RNCamera.Constants.FlashMode.auto:
        return (
          <TouchableOpacity
            onPress={() => { this.setState({flashMode: RNCamera.Constants.FlashMode.off}); }}
            style={{width:45, height:40, overflow:'hidden'}}
          >
            <Icon name={'ios-flash'} color={colors.white.hex} size={34} style={{position:'absolute', top:0, left:0}}/>
            <Text style={{position:'absolute', top:21, left:18, color:'white', fontSize:10}}>{"A"}</Text>
          </TouchableOpacity>
        );
      case RNCamera.Constants.FlashMode.off:
        return (
          <TouchableOpacity
            onPress={() => { this.setState({flashMode: RNCamera.Constants.FlashMode.on}); }}
            style={{width:45, height:40, overflow:'hidden'}}
          >
            <Icon name={'ios-flash'} color={colors.white.rgba(0.3)} size={34} style={{position:'absolute', top:0, left:0}}/>
            <Text style={{position:'absolute', top:21, left:18, color: colors.white.rgba(0.3), fontSize:10}}>{"off"}</Text>
          </TouchableOpacity>
        );
      case RNCamera.Constants.FlashMode.on:
        return (
          <TouchableOpacity
            onPress={() => { this.setState({flashMode: RNCamera.Constants.FlashMode.torch}); }}
            style={{width:45, height:40, overflow:'hidden'}}
          >
            <Icon name={'ios-flash'} color={colors.csOrange.hex} size={34} style={{position:'absolute', top:0, left:0}}/>
            <Text style={{position:'absolute', top:21, left:18, color: colors.csOrange.hex, fontSize:10}}>{"on"}</Text>
          </TouchableOpacity>
        );
      case RNCamera.Constants.FlashMode.torch:
        return (
          <TouchableOpacity
            onPress={() => { this.setState({flashMode: RNCamera.Constants.FlashMode.auto}); }}
            style={{width:45, height:40, overflow:'hidden'}}
          >
            <Icon name={'md-bulb'} color={colors.csOrange.hex} size={32} style={{position:'absolute', top:0, left:0}}/>
            <Text style={{position:'absolute', top:20, left:20, color: colors.csOrange.hex, fontSize:10, fontWeight:'bold'}}>{"on"}</Text>
          </TouchableOpacity>
        );
    }
  }
}
