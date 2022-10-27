
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TextInputOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Text, TouchableOpacity, View
} from "react-native";

import { colors, screenWidth, styles } from "../styles";
import { InterviewTextInput } from "../components/InterviewComponents";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { core } from "../../Core";
import { Icon } from "../components/Icon";
import { PopupButton } from "./LocationPermissionOverlay";
import { SimpleOverlayBox } from "../components/overlays/SimpleOverlayBox";


export class TextInputOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.state = {
      visible: true,
      value: props.data.value || null,
      pending: false,
      status: "NONE",
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.eventBus.on("hideTextInputOverlaySuccess", () => {
      this.setState({ok: true})
      setTimeout(() => {
        this.setState({ visible: false, value: null, ok: false })
        NavigationUtil.closeOverlay(this.props.componentId);
        this.unsubscribe.forEach((unsub) => { unsub(); });
        this.unsubscribe = [];
      }, 400);
    }))
    this.unsubscribe.push(core.eventBus.on("hideTextInputOverlayFailed", () => {
      this.setState({ok: true})
      setTimeout(() => {
        this.setState({ visible: false, value: null, ok: false })
        NavigationUtil.closeOverlay(this.props.componentId);
        this.unsubscribe.forEach((unsub) => { unsub(); });
        this.unsubscribe = [];
      }, 400);
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
    if (this.state.status !== "NONE") {
      return (
          <SimpleOverlayBox
            visible={this.state.visible}
            overrideBackButton={false}
            canClose={true}
            backgroundColor={this.state.status === "SUCCESS" ? colors.green.rgba(0.8) : colors.csOrange.rgba(0.8)}
            closeCallback={() => {
              this.setState({ visible: false, value: null });
              NavigationUtil.closeOverlay(this.props.componentId);
            }}
          >
            <View style={{flex:1, alignItems:'center', justifyContent:'center' }}>
              {this.state.status === "SUCCESS" ?
                <Icon name="ios-checkmark-circle" size={0.5 * screenWidth} color={colors.green.rgba(0.8)}/> :
                <Icon name="ios-close-circle" size={0.5 * screenWidth} color={colors.red.rgba(0.8)}/>
              }
            </View>
          </SimpleOverlayBox>
      );
    }
    else {
      let content = (
        <React.Fragment>
          <View style={{flex:0.5}} />
          <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue3.hex, padding:15}}>{this._getTitle()}</Text>
          <View style={{flex:0.5}} />
          <InterviewTextInput
            autofocus={true}
            placeholder={ "input text" }
            value={this.state.value}
            callback={(newValue) => {
              this.setState({value: newValue});
            }}
          />
          <View style={{flex:0.5}} />
          <Text style={{fontSize: 12, fontWeight: '400',  color: colors.blue3.hex, padding:15, textAlign:'center'}}>
            {this._getText()}
          </Text>
          <View style={{flex:1}} />
          {this.state.pending ? <ActivityIndicator size={"small"} /> : <PopupButton
              callback={() => {
                if (this.state.value !== null) {
                  this.setState({pending: true})
                  this.props.data.callback(this.state.value)
                }
                else {
                  this.setState({ visible: false, value: null, ok: false })
                  NavigationUtil.closeOverlay(this.props.componentId);
                }
              }} label={lang("Set_")} /> }
          <View style={{height:30}} />
        </React.Fragment>
      )


      if (Platform.OS === 'android') {
        return (
          <SimpleOverlayBox
            visible={this.state.visible}
            overrideBackButton={false}
            canClose={true}
            closeCallback={() => {
              this.setState({ visible: false, value: null, ok: false });
              NavigationUtil.closeOverlay(this.props.componentId);
            }}
          >
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              {content}
            </View>
          </SimpleOverlayBox>
        );
      }
      else {
        return (
          <SimpleOverlayBox
            visible={this.state.visible}
            overrideBackButton={false}
            canClose={true}
            closeCallback={() => {
              this.setState({ visible: false, value: null, ok: false });
              NavigationUtil.closeOverlay(this.props.componentId);
            }}
          >
            <TouchableOpacity activeOpacity={1.0} onPress={() => { Keyboard.dismiss() }} style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              {content}
            </TouchableOpacity>
          </SimpleOverlayBox>
        );
      }
    }
  }
}
