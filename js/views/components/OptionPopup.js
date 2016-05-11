import React, {
  Component,
  Dimensions,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { FadeInView }   from './animated/FadeInView'
import { SlideInFromBottomView }  from './animated/SlideInFromBottomView'
import { styles, colors } from './../styles'
import { eventBus } from '../../util/eventBus'

export class OptionPopup extends Component {
  getChildren() {
    let amountOfOptions = this.props.buttons.length;
    let buttonHeight = 50 * amountOfOptions + amountOfOptions - 1;
    
    let buttons = [];
    this.props.buttons.forEach((button, index) => {
      buttons.push(
        <TouchableHighlight style={styles.joinedButtons} onPress={() => {this.hide(); button.callback();}} key={'option_button_' + index}>
          <Text style={styles.buttonText}>{button.text}</Text>
        </TouchableHighlight>
      );
      if (index !== amountOfOptions - 1)
        buttons.push(<View style={styles.joinedButtonSeparator} key={'option_button_separator' + index} />)
    });


    return (
      <View style={[styles.joinedButton, {height:buttonHeight}]}>
        {buttons}
      </View>
    )
  }

  render() {
    let height = Dimensions.get('window').height;
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.3)'}]}
        height={height}
        visible={this.props.visible}>

        <SlideInFromBottomView
          style={[styles.centered, {backgroundColor:'transparent'}]}
          height={180}
          visible={this.props.visible}>
          {this.getChildren()}
          <TouchableHighlight style={styles.button} onPress={() => {eventBus.emit("hidePopup");}}><Text
            style={[styles.buttonText, {fontWeight:'bold'}]}>Cancel</Text></TouchableHighlight>
        </SlideInFromBottomView>
      </FadeInView>
    );
  }
}