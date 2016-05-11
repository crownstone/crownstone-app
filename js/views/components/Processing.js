import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo }       from './animated/AnimatedLogo'
import { AnimatedLoadingBar } from './animated/AnimatedLoadingBar'
import { FadeInView }         from './animated/FadeInView'
import { styles, colors}      from '../styles'

let { height } = Dimensions.get('window');

export class Processing extends Component {
  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'center', alignItems:'center'}]}
        height={height}
        duration={200}
        visible={this.state.visible}>
        <View style={{width: 200, height:120, alignItems:'center', justifyContent:'center'}} ><AnimatedLogo /></View>
        {this.props.text ? <Text style={[styles.menuText,{fontWeight:'bold'}]}>{this.props.text}</Text> : undefined}
        {this.props.progress !== undefined ? <AnimatedLoadingBar progress={this.props.progress} /> : undefined}
        {this.props.progressText ? <Text style={[styles.menuText,{fontSize:15, fontWeight:'400', fontStyle:'italic'}]}>{this.props.progressText}</Text> : undefined}
        {this.props.children}
      </FadeInView>
    );
  }
}