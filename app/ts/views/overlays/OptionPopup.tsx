
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OptionPopup", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Keyboard,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View, ScrollView
} from "react-native";

import { HiddenFadeInView }   from '../components/animated/FadeInView'
import { SlideInFromBottomView }  from '../components/animated/SlideInFromBottomView'
import { styles, screenHeight, screenWidth, tabBarMargin } from "../styles";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";


export class OptionPopup extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.state = {
      title: props.data.title || null,
      visible: false,
      buttons: props.data.buttons,
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.setState({visible: true})
    Keyboard.dismiss();
    this.unsubscribe.push(core.eventBus.on('UpdateOptionPopup', (data) => {
      this.setState({buttons: data.buttons})
    }));
    this.unsubscribe.push(core.eventBus.on('hidePopup', () => {
      this.setState({visible:false}, () => { NavigationUtil.closeOverlay(this.props.componentId); });
    }));
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
        <TouchableOpacity style={styles.joinedButtons} onPress={() => {
          if (button.close !== false) { core.eventBus.emit("hidePopup"); }
          button.callback();
        }} key={'option_button_' + index} testID={button.testID || "option"+index}>
          <Text style={styles.buttonText}>{button.text}</Text>
        </TouchableOpacity>
      );
      // insert separator
      if (index !== amountOfOptions - 1) {
        buttons.push(<View style={styles.joinedButtonSeparator} key={'option_button_separator' + index}/>)
      }
    });

    if (buttonContainerHeight > screenHeight - 65) {
      return (
        <ScrollView style={{height: screenHeight - 50, width:screenWidth}} contentOffset={{x:0,y:buttonContainerHeight - (screenHeight - 65)}}>
          <View style={styles.centered}>
            <View style={[styles.joinedButton, {height:buttonContainerHeight}]}>
              {buttons}
            </View>
          </View>
        </ScrollView>
      );
    }
    else {
      return (
        <View style={[styles.joinedButton, {height:buttonContainerHeight}]}>
          {buttons}
        </View>
      );
    }
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
        <TouchableHighlight style={styles.buttonAndroid} onPress={() => {
          if (button.close !== false) { core.eventBus.emit("hidePopup"); }
          button.callback();
        }} key={'option_button_' + index} testID={button.testID || "option"+index}>
          <Text style={styles.buttonTextAndroid}>{button.text}</Text>
        </TouchableHighlight>
      );
      buttons.push(<View style={styles.buttonSeparatorAndroid} key={'option_button_separator' + index} />)
    });

    buttons.push(
      <TouchableHighlight style={styles.buttonAndroid} onPress={() => { core.eventBus.emit("hidePopup");}} key={'option_button_cancel'} testID={"optionsCancel"}>
        <Text style={styles.buttonTextAndroid}>{ lang("Cancel") }</Text>
      </TouchableHighlight>
    );

    let amountOfOptions = this.state.buttons.length + 1;
    let buttonContainerHeight = 50 * amountOfOptions + amountOfOptions - 1;
    if (buttonContainerHeight > screenHeight - 65) {
      return (
        <ScrollView style={{height: screenHeight - 50, width:screenWidth}} contentOffset={{x:0,y:buttonContainerHeight - (screenHeight - 100)}}>
          <View style={styles.centered}>
            <View style={{height:buttonContainerHeight}}>
              {buttons}
            </View>
          </View>
        </ScrollView>
      );
    }
    return (
      <View style={{height:screenHeight, width: screenWidth, alignItems:'center', justifyContent:'center'}}>
        {buttons}
      </View>
    )
  }

  render() {
    if (Platform.OS === 'android') {
      return (
        <HiddenFadeInView
          style={[styles.fullscreen, {backgroundColor: 'rgba(0,0,0,0.3)'}]}
          height={screenHeight}
          duration={100}
          visible={this.state.visible}>
          {this.getChildrenAndroid()}
        </HiddenFadeInView>
      );
    }
    else {
      return (
        <HiddenFadeInView
          style={[styles.fullscreen, {backgroundColor: 'rgba(0,0,0,0.3)'}]}
          height={screenHeight}
          visible={this.state.visible}>
          <TouchableOpacity activeOpacity={1} onPress={() => { core.eventBus.emit("hidePopup"); }}>
            <SlideInFromBottomView
              style={[styles.centered, {justifyContent:'flex-end', backgroundColor: 'transparent'}]}
              height={screenHeight}
              visible={this.state.visible}>
              {this.getChildrenIOS()}
              <TouchableOpacity
                style={{...styles.button, marginBottom: 5 + tabBarMargin*0.5}}
                onPress={() => { core.eventBus.emit("hidePopup");}}
                testID={"optionsCancel"}
              >
                <Text style={[styles.buttonText, {fontWeight: 'bold'}]}>{ lang("Cancel") }</Text>
              </TouchableOpacity>
            </SlideInFromBottomView>
          </TouchableOpacity>
        </HiddenFadeInView>
      );
    }
  }
}
