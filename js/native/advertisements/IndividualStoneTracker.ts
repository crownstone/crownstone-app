import { Alert, Vibration } from 'react-native';

import { eventBus } from '../../util/EventBus';
import { LOG }      from '../../logging/Log'
import {Util} from "../../util/Util";

const meshRemovalThreshold : number = 200; // times not this crownstone in mesh

export class IndividualStoneTracker {
  unsubscribeMeshListener : any;
  meshNetworkId : number;
  stoneUID      : number;
  store         : any;
  sphereId      : string;
  stoneId       : string;

  notThisStoneCounter : number  = 0;


  constructor(store, sphereId, stoneId) {
    this.store = store;
    this.sphereId  = sphereId;
    this.stoneId = stoneId;

    this.stoneUID = store.getState().spheres[sphereId].stones[stoneId].config.crownstoneId;

    this.init()
  }

  init() {
    eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if ( change.meshIdUpdated && change.meshIdUpdated.stoneIds[this.stoneId] ) {
        this.updateListener();
      }
    });

    this.updateListener();
  }


  updateListener() {
    this.meshNetworkId = this.store.getState().spheres[this.sphereId].stones[this.stoneId].config.meshNetworkId;

    // cleanup previous listener
    if (this.unsubscribeMeshListener && typeof this.unsubscribeMeshListener === 'function') {
      this.unsubscribeMeshListener();
      this.unsubscribeMeshListener = undefined;
    }


    // if we have a network, listen for its advertisements
    if (this.meshNetworkId !== null) {
      this.unsubscribeMeshListener = eventBus.on(Util.events.getViaMeshTopic(this.sphereId, this.meshNetworkId), (data) => {
        if (data.id === this.stoneId) {
          LOG.info("PROGRESSING RESET ", this.stoneUID, " from ", this.meshNetworkId, "to ", 0);
          this.notThisStoneCounter = 0;
        }
        else {
          LOG.info("PROGRESSING ", this.stoneUID, " from ", this.meshNetworkId, "to ", this.notThisStoneCounter);
          this.notThisStoneCounter += 1;
        }

        if (this.notThisStoneCounter >= meshRemovalThreshold) {
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