import {SphereMockInterface} from "./SphereMockInterface";
import {MirrorDatabase} from "./MirrorDatabase";

type cloudId = string;

export class TestingAssistant {

  activeSphereId : string = null;
  spheres        : Record<cloudId, SphereMockInterface> = {}
  db             : any;

  constructor() {
    this.db = new MirrorDatabase()
  }


  async update() {
    await this.db.update();
    for (let sphereId in this.db.spheres) {
      let sphere = this.db.spheres[sphereId];
      this.spheres[sphereId] = new SphereMockInterface(sphereId, sphere.data.data.uuid);
      await this.spheres[sphereId].loadSphereData();
      await this.spheres[sphereId].checkForActive();
    }
    this._getActiveSphereId();
  }


  async getRoomId(roomIndex: number = 0) : Promise<string | null> {
    if (!this.activeSphereId) {
      await this._getActiveSphereId();
    }

    if (!this.activeSphereId) {
      return null;
    }
    let locationIds = Object.keys(this.db.spheres[this.activeSphereId].locations);
    return locationIds[roomIndex];
  }

  async doesRoomNameExists(name: string) : Promise<boolean> {
    console.log(this.activeSphereId)
    if (!this.activeSphereId) {
      await this._getActiveSphereId();
    }
    console.log(this.activeSphereId)

    if (!this.activeSphereId) {
      return false;
    }

    let locations = this.db.spheres[this.activeSphereId].locations;
    console.log(locations)
    for (let locationId in locations) {
      if (locations[locationId].data.data.name === name) {
        return true;
      }
    }
    return false;
  }



  _getActiveSphereId() {
    this.activeSphereId = null;
    for (let sphereId in this.spheres) {
      if (this.spheres[sphereId].activeSphere) {
        this.activeSphereId = sphereId;
        return sphereId;
      }
    }
  }
}
