import React, {
  Component,
  Dimensions,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { FadeInView }   from './animated/FadeInView'
import { SlideInFromBottomView }  from './animated/SlideInFromBottomView'
import { SlideFadeInView }  from './animated/SlideFadeInView'
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class PictureOptions extends Component {
  constructor() {
    super();
    this.state = {visible:false, showChildren:false};
  }

  show() {
    this.setState({showChildren:true});
    setTimeout(() => {this.setState({visible:true});}, 0);
  }

  hide() {
    this.setState({visible:false});
    setTimeout(() => {this.setState({showChildren:false});}, 200)
  }

  render() {
    let height = Dimensions.get('window').height;
    if (this.state.showChildren) {
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.3)'}]}
          height={height}
          visible={this.state.visible}>

          <SlideInFromBottomView
            style={[styles.centered, {backgroundColor:'transparent'}]}
            height={180}
            visible={this.state.visible}>
            <View style={styles.joinedButton}>
              <TouchableHighlight style={styles.joinedButtons} onPress={() => {this.hide(); Actions.pictureView({selectCallback:this.props.selectCallback});}}><Text style={styles.buttonText}>Take
                Picture</Text></TouchableHighlight>
              <View style={styles.joinedButtonSeparator}/>
              <TouchableHighlight style={styles.joinedButtons} onPress={() => {this.hide(); Actions.cameraRollView({selectCallback:this.props.selectCallback});}}><Text style={styles.buttonText}>Choose
                Existing</Text></TouchableHighlight>
            </View>
            <TouchableHighlight style={styles.button} onPress={this.hide.bind(this)}><Text
              style={[styles.buttonText, {fontWeight:'bold'}]}>Cancel</Text></TouchableHighlight>
          </SlideInFromBottomView>
        </FadeInView>
      )
    }
    else {
      return <View></View>
    }
  }
}