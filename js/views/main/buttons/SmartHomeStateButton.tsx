
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AutoArrangeButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator, Alert,
  Text,
  TouchableOpacity, View
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../core";
import { Icon } from "../../components/Icon";
import { Component } from "react";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";
import { SphereStateManager } from "../../../backgroundProcesses/SphereStateManager";

export class SmartHomeStateButton extends Component<any, any> {

  loadingTimeout = null;
  doubleCheckTimeout = null;
  unsubscribeEventListener = null;

  constructor(props) {
    super(props);

    this.state = {
      doubleCheck: false,
      showLoading: false,
    }
  }

  componentDidMount() {
    this.unsubscribeEventListener = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSphereSmartHomeState && change.changeSphereSmartHomeState.sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this._cleanup();
    this.unsubscribeEventListener();
  }

  _cleanup() {
    clearTimeout(this.doubleCheckTimeout);
    clearTimeout(this.loadingTimeout);
  }

  getContentData(currentState, outerRadius) {
    let iconColor             = colors.white.hex;
    let iconBackgroundColor   = colors.menuTextSelected.hex;
    let explanationColor      = colors.white.hex;
    let explanationTextColor  = colors.white.hex;
    let explanationLabel      = null;

    if (this.state.showLoading) {
      if (currentState === false) {
        // waiting to be disabled
        explanationTextColor = colors.white.hex;
        explanationColor     = colors.menuTextSelected.rgba(0.5);
        explanationLabel     = "Disabling...";
      }
      else {
        // waiting to be enabled
        explanationColor     = colors.green.rgba(0.2);
        explanationLabel     = "Enabling...";
        iconBackgroundColor  = colors.green.hex;
      }
    }
    else if (this.state.doubleCheck) {
      if (currentState === false) {
        // are you sure you want to enable?
        explanationColor     = colors.green.rgba(0.2);
        explanationLabel     = "Enable behaviour?";
        iconBackgroundColor  = colors.green.hex;
        explanationTextColor = colors.black.rgba(0.7 );
      }
      else {
        // are you sure you want to disable?
        explanationTextColor = colors.white.hex;
        explanationColor     = colors.menuTextSelected.rgba(0.5);
        explanationLabel     = "Tap again to\ndisable behaviour.";
      }
    }
    else {
      if (currentState === false) {
        // smart home is disabled
        explanationLabel     = "Behaviour disabled."
        explanationTextColor = colors.white.hex;
        explanationColor     = colors.menuTextSelected.rgba(0.2);
      }
      else {
        // smart home is enabled
        iconColor             = colors.csBlueDark.rgba(0.75);
        iconBackgroundColor   = colors.white.rgba(0.55);
      }
    }


    return {
      iconColor: iconColor, iconBackgroundColor: iconBackgroundColor, explanation:(
        <SlideSideFadeInView
          width={220}
          visible={explanationLabel !== null}
          style={{
            height: outerRadius,
            borderRadius: 0.5 * outerRadius,
            borderTopLeftRadius: 0,
            borderWidth:2,
            borderColor: colors.white.rgba(0.8),
            backgroundColor: explanationColor,
          }}
        >
          <View style={{
            flex:1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}>
            <View style={{ flex: 1 }}/>
            { explanationLabel &&
            <View style={{flexDirection:'row'}}>
              { this.state.showLoading && <ActivityIndicator size={'small'} color={explanationTextColor} style={{paddingRight:5}} /> }
              <Text style={{ fontWeight: 'bold', color: explanationTextColor, textAlign:'right' }}>{explanationLabel}</Text>
            </View>
            }
            <View style={{ flex: 0.2, paddingRight: outerRadius }}/>
          </View>
        </SlideSideFadeInView>
      )
    }
  }

  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let activeState = true;
    if (sphere) {
      activeState = sphere.state.smartHomeEnabled === true
    }

    let outerRadius = 0.11 * screenWidth;
    let innerRadius = outerRadius - 10;
    let size = 0.06 * screenWidth;

    let explanationOpen = !activeState || this.state.doubleCheck || this.state.showLoading;
    let contentData = this.getContentData(activeState, outerRadius)
    return (
      <HiddenFadeInView
        visible={this.props.visible}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: 6,
          flexDirection: 'row',
        }}>
        <TouchableOpacity style={{minWidth: outerRadius}} onPress={() => {
          if (sphere && sphere.state.present) {
            if (this.state.showLoading === false) {
              if (this.state.doubleCheck === false) {
                this.setState({doubleCheck: true});
                this.doubleCheckTimeout = setTimeout(() => { this.setState({doubleCheck: false});}, 2500);
              }
              else {
                this._cleanup();
                SphereStateManager.userSetSmartHomeState(this.props.sphereId, !activeState);
                this.setState({doubleCheck: false, showLoading: true });
                this.loadingTimeout = setTimeout(() => { this.setState({showLoading: false})}, 2000)
              }
            }
          }
          else {
            Alert.alert("You're not in the Sphere","You have to be in range of your Crownstones to disable their behaviour.",[{text:"OK"}])
          }
        }}>
          { contentData.explanation }
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: outerRadius,
            height: outerRadius,
            borderColor: colors.white.rgba(0.8),
            borderWidth: explanationOpen ? 2 : 0,
            borderRadius: 0.5 * outerRadius,
            backgroundColor: contentData.iconBackgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            { explanationOpen ? <Icon name="c1-brain" size={0.07 * screenWidth} color={contentData.iconColor}/> :
            <View style={{
              width: innerRadius,
              height: innerRadius,
              borderRadius: 0.5 * innerRadius,
              borderColor: contentData.iconColor,
              borderWidth: 2.5,
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="c1-brain" size={size} color={contentData.iconColor}/>
            </View>
            }
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }

}