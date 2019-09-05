import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceOverview", key)(a,b,c,d,e);
}
import * as React from 'react';

import { Background } from '../components/Background'
import { DeviceSummary }        from "./elements/DeviceSummaryProto";
import { BatchCommandHandler }  from "../../logic/BatchCommandHandler";
import { SphereDeleted }        from "../static/SphereDeleted";
import { StoneDeleted }         from "../static/StoneDeleted";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";


export class DeviceOverviewProto extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    const stone = state.spheres[props.sphereId].stones[props.stoneId];
    return TopBarUtil.getOptions({title:  stone.config.name});
  }

  unsubscribeStoreEvents: any;
  unsubscribeSwiperEvents: any = [];
  touchEndTimeout: any;
  summaryIndex: number = 0;
  showWhatsNewVersion: string = null;

  constructor(props) {
    super(props);

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return;
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return;
    }
    if (stone.config.firmwareVersionSeenInOverview === null) {
      core.store.dispatch({
        type: "UPDATE_STONE_LOCAL_CONFIG",
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: { firmwareVersionSeenInOverview: stone.config.firmwareVersion }
      });
    }
  }

  componentDidMount() {
    let state = core.store.getState();
    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenDeviceSettings: true } })
    }

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone && change.removeStone.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

      if (!stone || !stone.config) {
        return this.forceUpdate();
      }

    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.unsubscribeSwiperEvents.forEach((unsubscribe) => {
      unsubscribe();
    });
    clearTimeout(this.touchEndTimeout);
    // This will close the connection that is kept open by a dimming command. Dimming is the only command that keeps the connection open.
    // If there is no connection being kept open, this command will not do anything.
    BatchCommandHandler.closeKeptOpenConnection();

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (sphere) {
      const stone = sphere.stones[this.props.stoneId];
      if (stone && stone.config.firmwareVersionSeenInOverview !== stone.config.firmwareVersion) {
        core.store.dispatch({
          type: "UPDATE_STONE_LOCAL_CONFIG",
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: { firmwareVersionSeenInOverview: stone.config.firmwareVersion }
        });
      }
    }
  }



  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return <StoneDeleted/>
    }

    // let content = this._getContent(hasError, canUpdate, mustUpdate, hasBehaviour, hasPowerMonitor, hasScheduler, hasActivityLog, deviceType, stone.config);
    return (
      <Background image={core.background.lightBlur}>
        <DeviceSummary {...this.props} />
      </Background>
    )
  }

}

