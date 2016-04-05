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
      <Image style={{resizeMode:'cover', width: width, height:height}} source={this.props.background || require('../../images/background.png')}>
        {this.props.hideInterface !== true ? <View style={{width:width,height:31*pxRatio}} /> : undefined}
        <View style={{flex:1}}>
        {this.props.children}
        </View>
        {this.props.hideInterface !== true ? <View style={{width:width,height:25*pxRatio}} /> : undefined}

      </Image>
    </View>
  }
}