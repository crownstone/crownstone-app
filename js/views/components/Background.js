import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  View
} from 'react-native';

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class Background extends Component {

  render() {
    let width = Dimensions.get('window').width;
    let height = Dimensions.get('window').height;
    let pxRatio = PixelRatio.get();

    return <View style={{backgroundColor: '#c1c1c1'}}>
      <Image style={{resizeMode:'cover', width: width, height:height}} source={require('../../images/background.png')}>
        <View style={{width:width,height:32*pxRatio}} />
        <View style={{flex:1}}>
        {this.props.children}
        </View>
        <View style={{width:width,height:25*pxRatio}} />
      </Image>
    </View>
  }
}