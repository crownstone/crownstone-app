import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import { GenerateSphereTransferFunctions } from "./base/TransferBase";


export const SphereUserTransferNext : TransferSphereTool<SphereUserData, SphereUserDataLocalSettable, cloud_UserData, {} > = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: SphereUserData) : {} {
    return {}
  },


  mapCloudToLocal(cloudSphereUser: cloud_UserData) : SphereUserDataLocalSettable {
    return {
      firstName:         cloudSphereUser.firstName,
      lastName:          cloudSphereUser.lastName,
      email:             cloudSphereUser.email,
      invitationPending: cloudSphereUser.invitePending,
      pictureId:         cloudSphereUser.profilePicId,
      accessLevel:       cloudSphereUser.accessLevel,
      updatedAt:         new Date(cloudSphereUser.updatedAt).valueOf()
    }
  },


  getCreateLocalAction(localSphereId: string, data: Partial<SphereUserDataLocalSettable>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_SPHERE_USER", sphereId: localSphereId, userId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"NOT_REQUIRED"};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<SphereUserDataLocalSettable>) : DatabaseAction {
    return {type:"UPDATE_SPHERE_USER", sphereId: localSphereId, userId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_SPHERE_USER", sphereId: localSphereId, userId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: SphereUserData) : Promise<cloud_UserData> {
    throw "SPHERE_USERS_ARE_NOT_CREATED_HERE"
  },


  async updateOnCloud(localSphereId: string, data: SphereUserData) : Promise<void> {
    throw "SPHERE_USERS_ARE_NOT_UPDATED_HERE"
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteUserFromSphere(localId);
  },

  ...GenerateSphereTransferFunctions(this)
}

