
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { Image, TouchableOpacity, Text, View, Platform, ViewStyle, Dimensions } from "react-native";

import { RNCamera } from 'react-native-camera';

import {
  colors,
  screenWidth,
  screenHeight,
  styles,
  tabBarMargin,
  topBarHeight,
  statusBarHeight
} from "../styles";

import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarImitation } from "../components/TopbarImitation";
import { Icon } from "../components/Icon";
import { FileUtil } from "../../util/FileUtil";
import { Navigation } from "react-native-navigation";

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
      orientation:'portrait'
    };
    this.updateState(); // for initial render
  }

  updateState = () => {
    setTimeout(() => {
      let dim = Dimensions.get('window')
      let w = dim.width;
      let h = dim.height;
      if (w > h && this.state.orientation !== 'landscape') {
        this.setState({ orientation: 'landscape' })
      } else if (h > w && this.state.orientation !== 'portrait') {
        this.setState({ orientation: 'portrait' })
      }
    })
  }

  componentDidMount() {
    Navigation.mergeOptions(this.props.componentId, {layout: { orientation: ['portrait', 'landscape'] },})
    Dimensions.addEventListener('change', this.updateState);
  }
  componentWillUnmount() {
    Navigation.mergeOptions(this.props.componentId, {layout: { orientation: ['portrait'] },})
    Dimensions.removeEventListener('change', this.updateState);
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
    let width = screenWidth;
    let height = screenHeight;

    let x = screenWidth;
    let y = screenHeight;

    // somehow the camera does not take full screen size.
    let buttonSize = Math.min(60,0.18 * width);

    // has aspect ratio
    let isSquare = this.props.isSquare === true;

    let bottomPadding = 15;
    let bottomHeight = buttonSize + 2*bottomPadding + tabBarMargin;
    let maxSquarePictureHeight = height - topBarHeight - bottomHeight;


    let pictureWidth  = 100;
    let pictureHeight = 100;

    if (this.state.orientation === "landscape") {
      x = screenHeight;
      y = screenWidth;

      if (isSquare) {
        pictureWidth = screenWidth - topBarHeight;
        pictureHeight = screenWidth- topBarHeight;
      }
      else {
        pictureWidth = Math.min(screenHeight,1.5*(screenWidth - 0.5*topBarHeight));
        pictureHeight = screenWidth - 0.5*topBarHeight;
      }
    }
    else {
      if (isSquare) {
        pictureWidth = screenWidth;
        pictureHeight = screenWidth;
      }
      else {
        pictureWidth = screenWidth;
        pictureHeight = maxSquarePictureHeight;
      }
    }

    let bottomStyle : ViewStyle = {
      position:'absolute',
      bottom:0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: bottomPadding,
      paddingHorizontal: 20,
      flexDirection:'row',
      height: bottomHeight,
      width: x,
      paddingBottom: tabBarMargin,
      backgroundColor: 'transparent',
    };


    if (this.state.picture) {

      return (
        <View style={{flex:1, width: x, height: y, backgroundColor:colors.black.hex}}>
          {this.state.orientation === 'portrait' && <TopbarImitation
            leftStyle={{ color: colors.white.hex }}
            left={Platform.OS === 'android' ? null : "Back"}
            leftAction={() => {
              this.cleanup();
              NavigationUtil.dismissModal();
            }}
            style={{
              backgroundColor: colors.black.hex,
              paddingTop: this.state.orientation === 'portrait' ? statusBarHeight : 0,
              width: width
            }}
            title={"Did it go well?"}
          />
          }
          { this.state.orientation === 'portrait' && <View style={{width: x, height: 2, backgroundColor: colors.csOrange.hex }} /> }
          <View style={{flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
            <Image
              source={{uri:this.state.picture}}
              style={{
                width: pictureWidth,
                height: pictureHeight,
              }}
            />
          </View>
          { this.state.orientation === "portrait" && <View style={{height:bottomHeight*0.5, width: screenWidth}} /> }
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
          <View style={{height:tabBarMargin, width:x}} />
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1, width: x, height: y, backgroundColor:colors.black.hex}}>
          { this.state.orientation === 'portrait'  && <TopbarImitation
            leftStyle={{color: colors.white.hex}}
            left={Platform.OS === 'android' ? null : "Back"}
            leftAction={() => { NavigationUtil.dismissModal(); }}
            style={{backgroundColor:colors.black.hex, width: x}}
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
          /> }
          { this.state.orientation === 'portrait'  && <View style={{width: x, height: 2, backgroundColor: colors.csOrange.hex }} /> }
          <View style={{flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
            <RNCamera
              ref={ref => {
                this.camera = ref;
              }}
              captureAudio={false}
              style={{
                width: pictureWidth,
                height: pictureHeight,
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
          </View>
          { this.state.orientation === "portrait" && <View style={{height:bottomHeight*0.5, width: screenWidth}} /> }
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
          <View style={{height:tabBarMargin, width:x}} />
        </View>
      );
    }

  }

  takePicture = async() => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true, forceUpOrientation: this.state.orientation === "portrait", fixOrientation: true };
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
