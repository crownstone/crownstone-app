import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  View
} from 'react-native';

import { FadeInView } from './animated/FadeInView'
import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;


export class Processing extends Component {

  render() {
    let height = Dimensions.get('window').height;
    if (this.props.visible) {
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.5)'}]}
          height={height}
          visible={this.props.visible}>
          {this.props.children}
        </FadeInView>
      );
    }
    else {
      return <View></View>;
    }
  }
}