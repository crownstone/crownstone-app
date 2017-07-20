import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { FadeInView }   from './animated/FadeInView'
import { SlideInFromBottomView }  from './animated/SlideInFromBottomView'
import { styles, colors , screenHeight, screenWidth } from './../styles'
import { eventBus } from '../../util/EventBus'

export class OptionPopup extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();

    this.state = {
      visible: false,
      buttons: [],
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on('showPopup', (buttons) => {
      Keyboard.dismiss();
      this.setState({buttons:buttons, visible:true});
    }));
    this.unsubscribe.push(eventBus.on('hidePopup', () => {this.setState({visible:false})}));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  getChildren() {
    let amountOfOptions = this.state.buttons.length;
    let buttonContainerHeight = 50 * amountOfOptions + amountOfOptions - 1;
    
    let buttons = [];
    this.state.buttons.forEach((button, index) => {
      buttons.push(
        <TouchableHighlight style={styles.joinedButtons} onPress={() => {eventBus.emit("hidePopup"); button.callback();}} key={'option_button_' + index}>
          <Text style={styles.buttonText}>{button.text}</Text>
        </TouchableHighlight>
      );
      // insert separator
      if (index !== amountOfOptions - 1)
        buttons.push(<View style={styles.joinedButtonSeparator} key={'option_button_separator' + index} />)
    });

    return (
      <View style={[styles.joinedButton, {height:buttonContainerHeight}]}>
        {buttons}
      </View>
    )
  }

  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.3)'}]}
        height={screenHeight}
        visible={this.state.visible}>

        <SlideInFromBottomView
          style={[styles.centered, {backgroundColor:'transparent'}]}
          height={180}
          visible={this.state.visible}>
          {this.getChildren()}
          <TouchableHighlight style={styles.button} onPress={() => {eventBus.emit("hidePopup");}}><Text
            style={[styles.buttonText, {fontWeight:'bold'}]}>Cancel</Text></TouchableHighlight>
        </SlideInFromBottomView>
      </FadeInView>
    );
  }
}