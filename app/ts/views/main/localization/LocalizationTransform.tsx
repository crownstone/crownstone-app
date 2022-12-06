
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';

import { TopBarUtil } from "../../../util/TopBarUtil";
import {TransformManager} from "../../../localization/TransformManager";
import DeviceInfo from "react-native-device-info";
import { core } from "../../../Core";


export class LocalizationTransform extends React.Component<{sphereId: sphereId, otherUserId: string, otherDeviceId: string, deviceString: string, host: boolean, sessionId?:string}, {
  sessionState: TransformSessionState
}> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Optimize!"})
  }

  transformManager

  constructor(props) {
    super(props);
    this.state = {sessionState: "UNINITIALIZED"}

    let state = core.store.getState();

    if (props.host) {
      this.transformManager = new TransformManager(this.props.sphereId, state.user.userId, DeviceInfo.getDeviceId(), this.props.otherUserId, this.props.otherDeviceId);
    }
    else {
      this.transformManager = new TransformManager(this.props.sphereId, this.props.otherUserId, this.props.otherDeviceId, state.user.userId, DeviceInfo.getDeviceId(), props.sessionId);
    }

    this.transformManager.stateUpdate = (sessionState) => {
      this.setState({sessionState: sessionState});
    };

    this.transformManager.collectionUpdate = (collectionCount : number, collectedData: Record<string, rssi>) => {

    }
  }

  componentDidMount() {
    // start the transform session
    this.transformManager.start();
  }

  componentWillUnmount() {
    this.transformManager.destroy();
  }

}



LocalizationTransform.options = (props) => { return TopBarUtil.getOptions({ title: "Optimize!", closeModal: props.isModal ?? undefined}); }

