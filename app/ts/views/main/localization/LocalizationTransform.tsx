
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';

import { TopBarUtil } from "../../../util/TopBarUtil";
import {TransformManager} from "../../../localization/TransformManager";


export class LocalizationTransform extends React.Component<{sphereId: sphereId, userId: string, deviceId: string, deviceString: string}, {
  sessionState: TransformSessionState
}> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Optimize!"})
  }

  transformManager

  constructor(props) {
    super(props);
    this.state = {sessionState: "UNINITIALIZED"}

    this.transformManager = new TransformManager(this.props.sphereId, this.props.userId, this.props.deviceId);
    this.transformManager.stateUpdated = (sessionState) => {
      this.setState({sessionState: sessionState});
    }
  }

  componentDidMount() {
    // start the transform session
    this.transformManager.init();
  }

}



LocalizationTransform.options = (props) => { return TopBarUtil.getOptions({ title: "Optimize!", closeModal: props.isModal ?? undefined}); }

