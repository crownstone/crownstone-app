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
import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class PictureView extends Component {
  constructor(props) {
    super();
    this.state = {
      camera: Camera.constants.Type.front,
      flash:Camera.constants.FlashMode.auto,
      pictureTaken: false
    }
  }

  takePicture() {
    //TODO: do something with the image
    this.camera.capture()
      .then((data) => console.log(data))
      .catch(err => console.error(err));
  }

  switchCamera() {
    if (this.state.camera === Camera.constants.Type.front) {
      this.setState({camera: Camera.constants.Type.back})
    }
    else {
      this.setState({camera: Camera.constants.Type.front})
    }
  }

  toggleFlash() {
    if (this.state.flash === Camera.constants.FlashMode.on) {
      this.setState({flash: Camera.constants.FlashMode.off})
    }
    else if (this.state.flash === Camera.constants.FlashMode.off) {
      this.setState({flash: Camera.constants.FlashMode.auto})
    }
    else {
      this.setState({flash: Camera.constants.FlashMode.on})
    }
  }

  getFlashState() {
    if (this.state.camera === Camera.constants.Type.front) {
      return "Front camera has no flash"
    }
    else if (this.state.flash === Camera.constants.FlashMode.on) {
      return "on";
    }
    else if (this.state.flash === Camera.constants.FlashMode.auto) {
      return "auto";
    }
    else {
      return "off";
    }
  }


  render() {
    let width = Dimensions.get('window').width;
    let pxRatio = PixelRatio.get();

    if (this.state.pictureTaken === true) {
      return (
        <View style={{flex:1}}>
          <View style={[styles.shadedStatusBar, {backgroundColor:colors.menuBackground.h}]} />
          <View style={{width:width,height:31*pxRatio-20, flexDirection:'row', justifyContent:'center', alignItems:'center', backgroundColor:colors.menuBackground.h}}>
            <TouchableHighlight onPress={Actions.pop} style={{position:'absolute', left:10, height:31*pxRatio-20, width:90, justifyContent:'center'}}><Text style={styles.topBarLeft}>Cancel</Text></TouchableHighlight>
            <View><Text style={[styles.topBarLeft,{fontWeight:'bold'}]}>Take a Picture</Text></View>
          </View>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1}}>
          <TopBar title="Take A Picture" left="Cancel" leftAction={Actions.pop} notBack={true} />
          <Camera
            ref={(cam) => {this.camera = cam;}}
            type={this.state.camera}
            style={cameraStyle.preview}
            captureAudio={false}
            flashMode={this.state.flash}
            aspect={Camera.constants.Aspect.fill}>
            <TouchableOpacity onPress={this.toggleFlash.bind(this)} style={{position:'absolute',top:20,left:20}}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
              <View style={cameraStyle.button}>
                <Icon name={'ios-bolt'} size={38} color={'white'} style={cameraStyle.buttonIcon}/>
              </View>
              <Text style={{backgroundColor:'transparent', padding:4, color:'#ffff00'}}>{this.getFlashState()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.switchCamera.bind(this)} style={[cameraStyle.button,{position:'absolute',top:20,right:20}]} >
              <Icon name={'ios-reverse-camera'} size={38} color={'white'} style={cameraStyle.buttonIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.takePicture.bind(this)} style={[cameraStyle.snapButton,{bottom:20}]}>
              <Icon name={'ios-camera'} size={50} color={'white'} style={cameraStyle.buttonIcon} />
            </TouchableOpacity>
          </Camera>
        </View>
      );
    }
  }
}

const cameraStyle = StyleSheet.create({
  container: {
    flex: 1
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    color: '#000',
    padding: 10,
    margin: 40
  },
  button:{
    width:46,
    height:46,
    backgroundColor:'rgba(0,0,0,0.3)',
    borderRadius:23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:2,
    borderColor:'white'
  },
  buttonIcon:{
    backgroundColor:'transparent',
    position:'relative',
    top:1
  },
  snapButton:{
    width:60,
    height:60,
    backgroundColor:'rgba(0,0,0,0.3)',
    borderRadius:30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:2,
    borderColor:'white'
  },
});
