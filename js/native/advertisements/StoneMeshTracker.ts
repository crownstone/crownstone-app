import { Alert, Vibration } from 'react-native';

import { eventBus } from '../../util/EventBus';
import { LOG }      from '../../logging/Log';
import {Util} from "../../util/Util";

const meshRemovalThreshold : number = 200; // times not this crownstone in mesh
const meshRemovalTimeout : number = 200; // seconds
export class StoneMeshTracker {
  unsubscribeMeshListener : any;
  meshNetworkId : number;
  stoneUID      : number;
  store         : any;
  sphereId      : string;
  stoneId       : string;

  notThisStoneCounter : number  = 0;
  timeLastSeen : number  = 0;

  subscriptions = [];

  constructor(store, sphereId, stoneId) {
    this.store = store;
    this.sphereId  = sphereId;
    this.stoneId = stoneId;

    this.stoneUID = store.getState().spheres[sphereId].stones[stoneId].config.crownstoneId;
    this.timeLastSeen = 0;

    this.init()
  }

  init() {
    this.subscriptions.push(eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated && change.meshIdUpdated.stoneIds[this.stoneId] ) {
        this.updateListener();
      }
    }));

    this.updateListener();
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this._clearMeshListener();
  }

  _clearMeshListener() {
    if (this.unsubscribeMeshListener && typeof this.unsubscribeMeshListener === 'function') {
      this.unsubscribeMeshListener();
      this.unsubscribeMeshListener = undefined;
    }
  }


  updateListener() {
    let state = this.store.getState();
    let sphere = state.spheres[this.sphereId];
    if (!sphere) { return; }
    let stone = sphere.stones[this.stoneId];
    if (!stone) { return; }

    this.meshNetworkId = stone.config.meshNetworkId;

    // cleanup previous listener
    this._clearMeshListener();

    let now = new Date().valueOf();

    // if we have a network, listen for its advertisements
    if (this.meshNetworkId !== null) {
      this.unsubscribeMeshListener = eventBus.on(Util.events.getViaMeshTopic(this.sphereId, this.meshNetworkId), (data) => {
        if (data.id === this.stoneId) {
          this.timeLastSeen = now;
          this.notThisStoneCounter = 0;
        }
        else {
          this.notThisStoneCounter += 1;
        }

        if (this.notThisStoneCounter >= meshRemovalThreshold && now - this.timeLastSeen > meshRemovalTimeout*1000) {
          this.removeFromMesh();
        }
      });
    }
  }

  removeFromMesh() {
    // LOG.info("Removing stone", this.stoneUID, " from ", this.meshNetworkId);
    this.notThisStoneCounter = 0;
    this.store.dispatch({
      type: 'UPDATE_MESH_NETWORK_ID',
      sphereId: this.sphereId,
      stoneId: this.stoneId,
      data: {meshNetworkId: null}
    });
    this.updateListener();
  }

}