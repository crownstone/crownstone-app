
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';

import { CameraKitCamera, CameraKitCameraScreen } from 'react-native-camera-kit';

import {colors, screenWidth, screenHeight, } from '../styles'

import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

export class PictureView extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Take_Picture"),
    }
  };

  cameraView;

  componentDidMount() {
    // should be front
    if (this.props.initialView !== 'back' && core.sessionMemory.cameraSide !== 'front') {
      setTimeout(() => {
        this.cameraView.camera.changeCamera();
        core.sessionMemory.cameraSide = 'front';
      }, 150);
    }
    // should be back
    else if (this.props.initialView === 'back' && core.sessionMemory.cameraSide !== 'back') {
      setTimeout(() => {
        this.cameraView.camera.changeCamera();
        core.sessionMemory.cameraSide = 'back';
      }, 150);
    }
  }

  onBottomButtonPressed(event) {
    if (event.type === 'left') {
      NavigationUtil.back();
    }
    else if (event.type === 'right') {
      this.props.selectCallback(event.captureImages[0].uri);
      NavigationUtil.back();
    }
    else {

    }
  }


  render() {
    // somehow the camera does not take full screen size.
    return (
      <View style={{flex:1, width: screenWidth, height: screenHeight}}>
        <View style={{width: screenWidth, height: 10, backgroundColor: colors.black.hex }} />
        <CameraKitCameraScreen
          ref={(cam) => this.cameraView = cam}
          cameraOptions={{
            flashMode: 'auto',
            focusMode: 'on',
            zoomMode: 'on',
            ratioOverlay: this.props.forceAspectRatio === false ? undefined : '1:1',            // optional, ratio overlay on the camera and crop the image seamlessly
            ratioOverlayColor: colors.black.rgba(0.7),
            shouldSaveToCameraRoll:false
          }}
          allowCaptureRetake={true}
          actions={{
            rightButtonText: lang("Done"),
            leftButtonText: lang("Cancel"),
            leftCaptureRetakeButtonText:lang("Retry"),
            rightCaptureRetakeButtonText:lang("Select")
          }}
          onBottomButtonPressed={(event) => this.onBottomButtonPressed(event)}
          flashImages={{
            on: require('../../images/camera/flashOn.png'),
            off: require('../../images/camera/flashOff.png'),
            auto: require('../../images/camera/flashAuto.png')
          }}
          cameraFlipImage={require('../../images/camera/cameraFlipIcon.png')}
          captureButtonImage={require('../../images/camera/cameraButton.png')}
          shouldSaveToCameraRoll={false}
        />
      </View>
    );
  }
}
