
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';

import { Background } from "./Background";
import { background } from "../styles";
import {NavBarBlur, TopBarBlur} from "./NavBarBlur";


export class SettingsBackground extends Component<{
  style?:             any,
  hasNavBar?:         boolean,
  image?:             any,
  testID?:            string,
  keyboardAvoid?:     boolean,
}, any> {

  render() {
    return <Background {...{
      ...this.props,
      hasNavBar:false,
      hasTopBar:false,
      hideNotifications: true,
      image: background.menu
    }}>
      { this.props.children }
      <TopBarBlur />
      { this.props.hasNavBar && <NavBarBlur /> }
    </Background>
  }
}

export class SettingsNavbarBackground extends Component<{
  style?:             any,
  image?:             any,
  testID?:            string,
  keyboardAvoid?:     boolean,
}, any> {

  render() {
    return <SettingsBackground {...{...this.props, hasNavBar:true}}/>
  }
}