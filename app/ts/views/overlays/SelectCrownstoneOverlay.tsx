
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LockOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';

import { colors, screenWidth, screenHeight, topBarHeight, statusBarHeight } from "../styles";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SimpleOverlayBox } from "../components/overlays/SimpleOverlayBox";
import { ScrollView } from "react-native";
import { LocationLists } from "../selection/SelectCrownstone";

export class SelectCrownstoneOverlay extends Component<any, any> {
  unsubscribe : any;
  callback : any;
  sphereId : any;
  selection : string[];
  getItems : () => any[];

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      backgroundColor: props.backgroundColor || null,
    };
    this.unsubscribe = [];

    this.callback = props.callback;
    this.sphereId = props.sphereId;
  }

  componentDidMount() {
    this.setState({ visible: true });
    this.unsubscribe.push(core.eventBus.on("hideSelectCrownstoneOverlay", () => {
      this.close();
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  close() {
    this.setState({
      visible:false,
      backgroundColor:null
    }, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
  }

  render() {
    return (
      <SimpleOverlayBox
        visible={this.state.visible}
        overrideBackButton={false}
        canClose={true}
        scrollable={true}
        closeCallback={() => { this.close(); }}
        backgroundColor={colors.csBlue.rgba(0.2)}
        title={this.props.title}
      >
        <ScrollView contentContainerStyle={{backgroundColor: colors.gray.rgba(0.3)}}>
          <LocationLists
            sphereId={this.sphereId}
            callback={(stoneId) => { this.callback(stoneId); this.close(); }}
          />
        </ScrollView>
      </SimpleOverlayBox>
    );
  }
}



