import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo } from './animated/AnimatedLogo'
import { FadeInView } from './animated/FadeInView'
import { styles, colors} from '../styles'



export class Processing extends Component {
  constructor(props) {
    super();

    this.state = {visible: props.visible || false};
  }

  render() {
    let height = Dimensions.get('window').height;

    // this extra step is introduced to initialize the fadeview with visibility false
    let prevState = this.state.visible;
    if (this.props.visible !== this.state.visible) {
      setTimeout(() => {this.setState({visible: this.props.visible});},0);
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.75)'}]}
          height={height}
          duration={200}
          visible={prevState}>
          {this.props.children}
        </FadeInView>
      );
    }
    // this will be the processing view after initialization.
    if (this.state.visible === true) {
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'center', alignItems:'center'}]}
          height={height}
          duration={200}
          visible={this.state.visible}>
          <View style={{width: 200, height:120, alignItems:'center', justifyContent:'center'}} ><AnimatedLogo /></View>
          {this.props.text ? <Text style={[styles.menuText,{fontWeight:'bold'}]}>{this.props.text}</Text> : undefined}
          {this.props.children}
        </FadeInView>
      );
    }
    else {
      return <View></View>;
    }
  }
}