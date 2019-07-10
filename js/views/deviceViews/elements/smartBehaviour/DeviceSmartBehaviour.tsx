
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { DeviceSmartBehaviour_TypeSelectorBody } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../../core";
import { Background } from "../../../components/Background";
import { DeviceSmartBehaviour_RuleOverview } from "./DeviceSmartBehaviour_RuleOverview";
import {  View } from "react-native";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Util } from "../../../../util/Util";
import { LiveComponent } from "../../../LiveComponent";

export class DeviceSmartBehaviour extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store, core.store.getState(), props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(core.store, core.store.getState(), this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') { this.setState({ editMode: true  }, updateTopBar);  }
    if (buttonId === 'save') { this.setState({ editMode: false }, updateTopBar); }

  }

  constructor(props) {
    super(props);

    this.state = {editMode: false}
  }

  unsubscribeStoreEvents;
  componentDidMount(): void {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.stoneChangeRules
      ) {
        getTopBarProps(core.store, core.store.getState(), this.props, this.state);
        TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeStoreEvents();
  }

  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return <View />;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rulesCreated = Object.keys(stone.rules).length > 0;

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        {
          rulesCreated || this.state.editMode === true ?
          <DeviceSmartBehaviour_RuleOverview     sphereId={this.props.sphereId} stoneId={this.props.stoneId} editMode={this.state.editMode }/> :
          <DeviceSmartBehaviour_TypeSelectorBody sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
        }
      </Background>
    );
  }
}


function getTopBarProps(store, state, props, viewState) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  const element = Util.data.getElement(store, props.sphereId, props.stoneId, stone);
  let rulesCreated = Object.keys(stone.rules).length > 0;

  if (viewState.editMode === true) {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      save: true,
      closeModal: true,
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      edit: rulesCreated === true ? true : undefined,
      closeModal: true,
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;
