import {SphereMockInterface} from "./SphereMockInterface";
import {MirrorDatabase} from "./MirrorDatabase";

type cloudId = string;

export class TestingAssistant {

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
    }
  }
}
