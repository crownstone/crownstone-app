
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BleStateOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text, TouchableOpacity, TouchableWithoutFeedback,
  View
} from "react-native";

import { OverlayBox } from '../components/overlays/OverlayBox'
import { colors, screenHeight, screenWidth, styles } from "../styles";
import { InterviewTextInput } from "../components/InterviewComponents";
import { NavigationUtil } from "../../util/NavigationUtil";
import { core } from "../../core";
import { Icon } from "../components/Icon";


export class NumericOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      value: props.data.value || null,
      ok: false,
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.eventBus.on("hideNumericOverlay", () => {
      this.setState({ok: true})
      setTimeout(() => {
        this.setState({ visible: false, value: null, ok: false })
        NavigationUtil.closeOverlay(this.props.componentId);
        this.unsubscribe.forEach((unsub) => { unsub(); });
        this.unsubscribe = [];
      }, 400)

    }))
  }

  componentWillUnmount(): void {
    this.unsubscribe.forEach((unsub) => { unsub(); });
  }

  _getTitle() {
    return this.props.data.title;
  }

  _getText() {
    return this.props.data.text;
  }

  render() {
    if (this.state.ok) {
      return (
          <OverlayBox
            visible={this.state.visible}
            overrideBackButton={false}
            canClose={true}
            backgroundColor={colors.green.rgba(0.8)}
            closeCallback={() => {
              this.setState({ visible: false, value: null });
              NavigationUtil.closeOverlay(this.props.componentId);
            }}
          >
            <View style={{flex:1, alignItems:'center', justifyContent:'center' }}>
              <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.green.rgba(0.8)} />
            </View>
          </OverlayBox>
      );
    }
    else {
      return (
        <TouchableOpacity activeOpacity={1.0} onPress={() => { Keyboard.dismiss() }} style={styles.centered}>
          <OverlayBox
            visible={this.state.visible}
            overrideBackButton={false}
            canClose={true}
            closeCallback={() => {
              this.setState({ visible: false, value: null, ok: false });
              NavigationUtil.closeOverlay(this.props.componentId);
            }}
          >
            <TouchableOpacity activeOpacity={1.0} onPress={() => { Keyboard.dismiss() }} style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              <View style={{flex:0.5}} />
              <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue.hex, padding:15}}>{this._getTitle()}</Text>
              <View style={{flex:0.5}} />
              <InterviewTextInput
                autofocus={true}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder={ "set value" }
                value={this.state.value}
                callback={(newValue) => {
                  if (newValue.indexOf(",") !== -1) {
                    if (newValue.indexOf(".") !== -1) {
                      newValue = newValue.replace(",","");
                    }
                    else {
                      newValue = newValue.replace(",",".");
                    }
                  }
                  this.setState({value: newValue});
                }}
              />
              <View style={{flex:0.5}} />
              <Text style={{fontSize: 12, fontWeight: '400',  color: colors.blue.hex, padding:15, textAlign:'center'}}>
                {this._getText()}
              </Text>
              <View style={{flex:1}} />
              <TouchableOpacity
                onPress={() => {
                  if (this.state.value !== null) {
                    this.props.data.callback(this.state.value)
                  }
                  else {
                    this.setState({ visible: false, value: null, ok: false })
                    NavigationUtil.closeOverlay(this.props.componentId);
                  }
                }}
                style={[styles.centered, {
                  width: 0.4 * screenWidth,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: colors.blue.rgba(0.5),
                }]}>
                <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.blue.hex}}>{"Set!"}</Text>
              </TouchableOpacity>
              <View style={{height:30}} />
            </TouchableOpacity>
          </OverlayBox>
        </TouchableOpacity>
      );
    }
  }
}