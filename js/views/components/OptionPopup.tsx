import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
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
import {CameraRollView} from "../cameraViews/CameraRollView";


export class OptionPopup extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();
    this.state = {
      title: null,
      visible: false,
      buttons: [],
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on('showPopup', (data) => {
      Keyboard.dismiss();
      this.setState({title: data.title || null, buttons:data.buttons, visible:true});
    }));
    this.unsubscribe.push(eventBus.on('hidePopup', () => {this.setState({visible:false})}));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  getChildrenIOS() {
    let amountOfOptions = this.state.buttons.length;
    let buttonContainerHeight = 50 * amountOfOptions + amountOfOptions - 1;
    
    let buttons = [];
    this.state.buttons.forEach((button, index) => {
      buttons.push(
        <TouchableOpacity style={styles.joinedButtons} onPress={() => {eventBus.emit("hidePopup"); button.callback();}} key={'option_button_' + index}>
          <Text style={styles.buttonText}>{button.text}</Text>
        </TouchableOpacity>
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

  getChildrenAndroid() {
    let buttons = [];
    if (this.state.title) {
      buttons.push(
        <View style={styles.buttonTitleAndroid} key={'option_button_title'}>
          <Text style={styles.buttonTextTitleAndroid}>{this.state.title}</Text>
        </View>
      );
      buttons.push(<View style={styles.buttonSeparatorAndroidHighlight} key={'option_button_separator_title_highlight'} />)
    }

    this.state.buttons.forEach((button, index) => {
      buttons.push(
        <TouchableOpacity style={styles.buttonAndroid} onPress={() => {eventBus.emit("hidePopup"); button.callback();}} key={'option_button_' + index}>
          <Text style={styles.buttonTextAndroid}>{button.text}</Text>
        </TouchableOpacity>
      );
      buttons.push(<View style={styles.buttonSeparatorAndroid} key={'option_button_separator' + index} />)
    });

    buttons.push(
      <TouchableOpacity style={styles.buttonAndroid} onPress={() => { eventBus.emit("hidePopup");}} key={'option_button_cancel'}>
        <Text style={styles.buttonTextAndroid}>Cancel</Text>
      </TouchableOpacity>
    );


    return (
      <View style={{height:screenHeight, width: screenWidth, alignItems:'center', justifyContent:'center'}}>
        {buttons}
      </View>
    )
  }

  render() {
    if (Platform.OS === 'android') {
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor: 'rgba(0,0,0,0.3)'}]}
          height={screenHeight}
          duration={100}
          visible={this.state.visible}>
          {this.getChildrenAndroid()}
        </FadeInView>
      );
    }
    else {
      return (
        <FadeInView
          style={[styles.fullscreen, {backgroundColor: 'rgba(0,0,0,0.3)'}]}
          height={screenHeight}
          visible={this.state.visible}>
          <SlideInFromBottomView
            style={[styles.centered, {backgroundColor: 'transparent'}]}
            height={180}
            visible={this.state.visible}>
            {this.getChildrenIOS()}
            <TouchableOpacity style={styles.button} onPress={() => { eventBus.emit("hidePopup");}}>
              <Text style={[styles.buttonText, {fontWeight: 'bold'}]}>Cancel</Text>
            </TouchableOpacity>
          </SlideInFromBottomView>
        </FadeInView>
      );
    }
  }
}