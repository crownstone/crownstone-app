
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';

import {Background, BaseBackground} from "./Background";
import { background } from "../styles";
import {NavBarBlur, TopBarBlur} from "./NavBarBlur";

interface SettingsBackgroundProps {
  style?:             any,
  hasNavBar?:         boolean,
  image?:             any,
  testID?:            string,
  keyboardAvoid?:     boolean,
}
interface SettingsNavbarBackgroundProps {
  style?:             any,
  image?:             any,
  testID?:            string,
  keyboardAvoid?:     boolean,
}

export class SettingsBackground extends Component<SettingsBackgroundProps, any> {
  render() {
    return <BaseBackground {...{
      ...this.props,
      hasNavBar:false,
      hasTopBar:false,
      image: background.menu
    }}>
      { this.props.children }
      <TopBarBlur />
      { this.props.hasNavBar && <NavBarBlur /> }
    </BaseBackground>
  }
}

export class SettingsCustomTopBarBackground extends Component<SettingsBackgroundProps, any> {

  render() {
    return <BaseBackground {...{
      ...this.props,
      hasNavBar:false,
      hasTopBar:false,
      image: background.menu
    }}>
      { this.props.children }
      { this.props.hasNavBar && <NavBarBlur /> }
    </BaseBackground>
  }
}

export class SettingsNavbarBackground extends Component<SettingsNavbarBackgroundProps, any> {
  render() {
    return <SettingsBackground {...{...this.props, hasNavBar:true}}/>
  }
}
export class SettingsCustomTopBarNavbarBackground extends Component<SettingsNavbarBackgroundProps, any> {
  render() {
    return <SettingsCustomTopBarBackground {...{...this.props, hasNavBar:true}}/>
  }
}

