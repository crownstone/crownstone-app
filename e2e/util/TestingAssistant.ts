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
    this.spheres = {};
    for (let sphereId in this.db.spheres) {
      let sphere = this.db.spheres[sphereId];
      this.spheres[sphereId] = new SphereMockInterface(sphereId, sphere.data.data.uuid);
      await this.spheres[sphereId].loadSphereData();
      await this.spheres[sphereId].checkForActive();
    }
    await this._getActiveSphereId();
  }

  getSphereIdByName(name) {
    for (let sphereId in this.db.spheres) {
      if (this.db.spheres.data.data.name === name) {
        return sphereId;
      }
    }
  }


  getSphereIdMostRecent() {
    let creationTime = 0;
    let candidate = null;
    for (let sphereId in this.db.spheres) {
      let createdAt = new Date(this.db.spheres[sphereId].data.data.createdAt).valueOf();
      if (createdAt > creationTime) {
        creationTime = createdAt;
        candidate = sphereId;
      }
    }
    return candidate;
  }

  async getRoomId(roomIndex: number = 0) : Promise<string | null> {
    console.log("this.activeSphereId", this.activeSphereId)
    if (!this.activeSphereId) {
      await this._getActiveSphereId();
    }

    console.log("this.activeSphereId", this.activeSphereId)
    if (!this.activeSphereId) {
      return null;
    }
    console.log("this.db.spheres", this.db.spheres)
    console.log("this.db.spheres[this.activeSphereId]", this.db.spheres[this.activeSphereId])
    let locationIds = Object.keys(this.db.spheres[this.activeSphereId].locations);
    return locationIds[roomIndex];
  }

  async doesRoomNameExists(name: string) : Promise<boolean> {
    console.log('doesRoomNameExists', this.activeSphereId)
    if (!this.activeSphereId) {
      await this._getActiveSphereId();
    }
    console.log('doesRoomNameExists', this.activeSphereId)

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
    return null;
  }
}
