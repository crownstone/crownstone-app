
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';

import { Background } from "./Background";


export class BackgroundNoNotification extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  style?:                    any,
  hasNavBar?:                boolean,

  dimStatusBar?:      boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  topImage?:          any,
  testID?:            string,
  keyboardAvoid?:     boolean,
}, any> {

  render() {
    return <Background {...{...this.props, hideNotifications: true}} />
  }
}