
import {
  getMapOfCrownstonesBySphereByHandle, getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle
} from "../util/DataUtil";

/**
 * Map format
 *
 * stoneCIDMap = {sphereId: {crownstoneId: {map}}}
 * stoneSphereHandleMap = {sphereId: {handle: {map}}}
 * stoneHandleMap = {handle: {map}}}
 *
 * map = {
 *  id: stoneId, // redux database id
 *  cid: number,
 *  handle: string,
 *  name: string,
 *  sphereId: string,
 *  applianceName: string / undefined
 *  applianceId: string / undefined
 *  locationName: string / undefined
 *  locationId: string / undefined
 * }
 *
 */

class MapProviderClass {
  _store : any;
  _initialized : boolean = false;
  stoneSphereHandleMap : any = {};
  stoneHandleMap : any = {};
  stoneCIDMap : any = {};
  state : any = {};

  loadStore(store) {
    if (this._initialized === false) {
      this._store = store;

      // refresh maps when the database changes
      this._store.subscribe(() => {
        this.state = this._store.getState();
        this.stoneSphereHandleMap = getMapOfCrownstonesBySphereByHandle(this.state);
        this.stoneHandleMap = getMapOfCrownstonesInAllSpheresByHandle(this.state);
        this.stoneCIDMap = getMapOfCrownstonesInAllSpheresByCID(this.state);
      });

    }
  }
}


export const MapProvider = new MapProviderClass();