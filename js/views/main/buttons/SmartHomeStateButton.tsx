
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
    let size = 0.08 * screenWidth;
    let color = !this.props.state ? colors.white.hex : colors.csBlueDark.rgba(0.75);



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
            visible={!this.props.state || this.state.doubleCheck }
            style={{
              height: outerRadius,
              borderRadius: 0.5 * outerRadius,
              borderTopLeftRadius: 0,
              borderWidth:2,
              borderColor: colors.white.rgba(0.8),
              backgroundColor: this.state.doubleCheck ? colors.menuTextSelected.rgba(0.35) : colors.menuTextSelected.rgba(0.1),
            }}
          >
            <View style={{
              flex:1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row'
            }}>
              <View style={{ flex: 1 }}/>
              {this.props.state === false && this.state.doubleCheck === false && <Text style={{ fontWeight: 'bold' }}>{"Behaviour disabled."}</Text> }
              {this.props.state === true && this.state.doubleCheck === true && <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign:'right', color: colors.white.hex }}>{"Tap again to\ndisable behaviour."}</Text> }
              {this.props.state === false && this.state.doubleCheck === true && <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign:'right', color: colors.white.hex }}>{"Enable behaviour?"}</Text> }
              <View style={{ flex: 0.2, paddingRight: outerRadius }}/>

            </View>
          </SlideSideFadeInView>
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: outerRadius,
            height: outerRadius,
            borderColor: this.props.state ? colors.white.rgba(0.3) : colors.white.hex,
            borderWidth: this.props.state ? 5 : 2,
            borderRadius: 0.5 * outerRadius,

            backgroundColor: this.props.state ? colors.white.rgba(0.7) : colors.menuTextSelected.hex,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name="c1-brain" size={size} color={color}/>
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }

}