import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";


export const SceneTransferNext : TransferSphereTool<SceneData, SceneData, cloud_Scene, cloud_Scene_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: SceneData) : cloud_Scene_settable {
    let result : cloud_Scene_settable = {
      name:      localData.name,
      data:      JSON.stringify(localData.data),
      updatedAt: localData.updatedAt
    };

    if (localData.pictureSource === "STOCK") {
      result.stockPicture = localData.picture;
    }

    return result;
  },


  mapCloudToLocal(cloudScene: cloud_Scene) : Partial<SceneData> {
    let result : Partial<SceneData> = {
      name:          cloudScene.name,
      pictureId:     cloudScene.customPictureId,
      pictureSource: cloudScene.customPictureId ? "CUSTOM" : "STOCK", // PICTURE_GALLERY_TYPES
      cloudId:       cloudScene.id,
      data:          typeof cloudScene.data === 'string' ? JSON.parse(cloudScene.data) : cloudScene.data,
      updatedAt:     new Date(cloudScene.updatedAt).valueOf()
    }

    if (cloudScene.stockPicture) {
      result.picture = cloudScene.stockPicture;
    }

    return result;
  },


  getCreateLocalAction(localSphereId: string, data: Partial<SceneData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_SCENE", sphereId: localSphereId, sceneId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_SCENE_CLOUD_ID", sphereId: localSphereId, sceneId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<SceneData>) : DatabaseAction {
    return {type:"UPDATE_SCENE", sphereId: localSphereId, sceneId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_SCENE", sphereId: localSphereId, sceneId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: SceneData) : Promise<cloud_Scene> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createScene(SceneTransferNext.mapLocalToCloud(data));
    core.store.dispatch({
      type: 'UPDATE_SCENE_CLOUD_ID', sphereId: localSphereId, sceneId: data.id,
      data: { cloudId: cloudItem.id, uid: cloudItem.uid }
    });
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: SceneData) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).updateScene(data.id, SceneTransferNext.mapLocalToCloud(data));
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    await CLOUD.forSphere(cloudSphereId).deleteScene(localId);
  },


  createLocal(localSphereId: string, data: Partial<any>) {
    let newItemData = SceneTransferNext.getCreateLocalAction(localSphereId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

