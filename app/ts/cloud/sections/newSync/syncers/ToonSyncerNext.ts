import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { Get } from "../../../../util/GetUtil";
import { SyncSphereInterface } from "./base/SyncSphereInterface";



export class ToonSyncerNext extends SyncSphereInterface<ToonData, cloud_Toon, cloud_Toon_settable> {

  getLocalId() {
    return this.globalCloudIdMap.toons[this.cloudId] || MapProvider.cloud2localMap.toons[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: ToonData) : cloud_Toon_settable | null {
    let result : cloud_Toon_settable = {
      toonAgreementId:         localData.toonAgreementId,
      toonAddress:             localData.toonAddress,
      updatedAt:               new Date(localData.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudToon: cloud_Toon) : Partial<ToonData> {
    return {
      toonAgreementId:         cloudToon.toonAgreementId,
      toonAddress:             cloudToon.toonAddress,
      cloudId:                 cloudToon.id,
      schedule:                cloudToon.schedule,
      updatedScheduleTime:     cloudToon.updatedScheduleTime,
      cloudChangedProgram:     cloudToon.changedToProgram,
      cloudChangedProgramTime: cloudToon.changedProgramTime,
      updatedAt:               new Date(cloudToon.updatedAt).valueOf()
    }
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_TOON_CLOUD_ID", sphereId: this.localSphereId, toonId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_TOON", sphereId: this.localSphereId, toonId: this.localId });
  }

  createLocal(cloudData: cloud_Toon) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.toons[this.cloudId] = newId;
    this.actions.push({type:"ADD_TOON", sphereId: this.localSphereId, toonId: newId, data: ToonSyncerNext.mapCloudToLocal(cloudData) })
  }

  updateLocal(cloudData: cloud_Toon) {
    this.actions.push({type:"UPDATE_TOON", sphereId: this.localSphereId, toonId: this.localId, data: ToonSyncerNext.mapCloudToLocal(cloudData) })
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let toon = Get.toon(this.localSphereId, this.localId);
    if (!toon) { return null; }
    if (reply.toons === undefined) {
      reply.toons = {};
    }
    if (reply.toons[this.cloudId] === undefined) {
      reply.toons[this.cloudId] = {};
    }
    reply.toons[this.cloudId].data = ToonSyncerNext.mapLocalToCloud(toon)
  }
}

