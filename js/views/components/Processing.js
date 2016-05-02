import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  View
} from 'react-native';

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
          style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.75)'}]}
          height={height}
          duration={200}
          visible={this.state.visible}>
          {this.props.children}
        </FadeInView>
      );
    }
    else {
      return <View></View>;
    }
  }
}