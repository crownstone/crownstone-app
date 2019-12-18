
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AutoArrangeButton", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  TouchableOpacity, View
} from "react-native";
import {colors, screenWidth} from "../../styles";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { core } from "../../../core";
import { Icon } from "../../components/Icon";
import { Component } from "react";
import { SlideFadeInView, SlideSideFadeInView } from "../../components/animated/SlideFadeInView";

export class SmartHomeStateButton extends Component<any, any> {

  doubleCheckTimeout = null;

  constructor(props) {
    super(props);

    this.state = {
      doubleCheck: false,
    }
  }

  _cleanup() {
    clearTimeout(this.doubleCheckTimeout);
  }

  render() {
    let outerRadius = 0.11 * screenWidth;
    let innerRadius = outerRadius - 10;
    let size = 0.06 * screenWidth;

    let explanationOpen = !this.props.state || this.state.doubleCheck;
    let iconColor             = null;
    let iconBackgroundColor   = null;
    let explanationColor      = null;
    let explanationLabel      = null;
    let explanationTextColor  = null;

    if (this.state.doubleCheck) {
      iconColor = colors.white.hex;
      if (this.props.state === false) {
        // will enable
        explanationColor     = colors.green.rgba(0.2);
        explanationLabel     = "Enable behaviour?";
        iconBackgroundColor  = colors.green.hex;
      }
      else {
        // tap to disable
        explanationTextColor = colors.white.hex;
        explanationColor     = colors.menuTextSelected.rgba(0.5);

        explanationLabel     = "Tap again to\ndisable behaviour.";
        iconBackgroundColor = colors.menuTextSelected.hex;
      }
    }
    else {
      if (explanationOpen === false) {
        // only an icon
        iconColor             = colors.csBlueDark.rgba(0.75);
        iconBackgroundColor   = colors.white.rgba(0.55);
      }
      else {
        // smart home disabled
        explanationLabel     = "Behaviour disabled."
        explanationTextColor = colors.white.hex;
        explanationColor     = colors.menuTextSelected.rgba(0.1);

        iconBackgroundColor  = colors.menuTextSelected.hex;
        iconColor            = colors.white.hex;
      }
    }



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
          if (this.state.doubleCheck === false) {
            this.setState({doubleCheck: true});
            this.doubleCheckTimeout = setTimeout(() => { this.setState({doubleCheck: false});}, 2500);
          }
          else {
            this._cleanup();
            this.setState({doubleCheck: false});
            core.store.dispatch({
              type: "SET_SPHERE_SMART_HOME_STATE",
              sphereId: this.props.sphereId,
              data: { smartHomeEnabled: !this.props.state }
            })
            // TODO: Broadcast enable/disable
          }
        }}>
          <SlideSideFadeInView
            width={0.6 * screenWidth}
            visible={explanationOpen}
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
              {explanationOpen && this.state.doubleCheck === false && <Text style={{ fontWeight: 'bold' }}>{"Behaviour disabled."}</Text> }
              {explanationOpen && this.state.doubleCheck === true  && <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign:'right', color: explanationTextColor }}>{explanationLabel}</Text> }
              <View style={{ flex: 0.2, paddingRight: outerRadius }}/>

            </View>
          </SlideSideFadeInView>
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: outerRadius,
            height: outerRadius,
            borderColor: colors.white.rgba(0.8),
            borderWidth: explanationOpen ? 2 : 0,
            borderRadius: 0.5 * outerRadius,

            backgroundColor: iconBackgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            { explanationOpen ? <Icon name="c1-brain" size={0.07 * screenWidth} color={iconColor}/> :
            <View style={{
              width: innerRadius,
              height: innerRadius,
              borderRadius: 0.5 * innerRadius,
              borderColor: iconColor,
              borderWidth: 3,
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="c1-brain" size={size} color={iconColor}/>
            </View>
            }
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }

}