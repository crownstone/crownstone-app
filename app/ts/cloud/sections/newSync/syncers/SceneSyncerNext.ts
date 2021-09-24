import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";
import { CLOUD } from "../../../cloudAPI";
import { FileUtil } from "../../../../util/FileUtil";
import { LOGe } from "../../../../logging/Log";


export class SceneSyncerNext extends SyncInterface<SceneData, cloud_Scene, cloud_Scene_settable> {

  getLocalId() {
    return this.globalCloudIdMap.scenes[this.cloudId] || MapProvider.cloud2localMap.scenes[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localData: SceneData) : cloud_Scene_settable | null {
    let result : cloud_Scene_settable = {
      name:      localData.name,
      data:      JSON.stringify(localData.data),
      updatedAt: localData.updatedAt
    };

    if (localData.pictureSource === "STOCK") {
      result.stockPicture = localData.picture;
    }
    else {
      result.customPictureId = localData.pictureId;
    }

    return result;
  }


  static mapCloudToLocal(cloudScene: cloud_Scene, localSceneId?: string) {
    let result : Partial<SceneData> = {
      name:          cloudScene.name,
      pictureId:     cloudScene.customPictureId,
      pictureSource: cloudScene.stockPicture ? "STOCK" : "CUSTOM", // PICTURE_GALLERY_TYPES
      cloudId:       cloudScene.id,
      data:          typeof cloudScene.data === 'string' ? JSON.parse(cloudScene.data) : cloudScene.data,
      updatedAt:     new Date(cloudScene.updatedAt).valueOf()
    }

    if (cloudScene.stockPicture === "STOCK") {
      result.picture = cloudScene.stockPicture;
    }

    return result;
  }

  _mapCloudToLocal(cloudScene: cloud_Scene) {
    let localSceneId = this.globalCloudIdMap.scenes[cloudScene.id] ?? MapProvider.cloud2localMap.scenes[cloudScene.id] ?? cloudScene.id;

    return SceneSyncerNext.mapCloudToLocal(cloudScene, localSceneId);
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_SCENE_CLOUD_ID", sphereId: this.localSphereId, sceneId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_SCENE", sphereId: this.localSphereId, sceneId: this.localId });
  }

  createLocal(cloudData: cloud_Scene) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.scenes[this.cloudId] = newId;
    this.actions.push({type:"ADD_SCENE", sphereId: this.localSphereId, sceneId: newId, data: this._mapCloudToLocal(cloudData) })

    if (cloudData.customPictureId) {
      this._downloadSceneImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_Scene) {
    this.actions.push({type:"UPDATE_SCENE", sphereId: this.localSphereId, sceneId: this.localId, data: this._mapCloudToLocal(cloudData) })

    // check if we have to do things with the image
    let scene = Get.scene(this.localSphereId, this.localId);
    // if there is no image on the cloud, but we expect a custom image, delete our custom image
    // the cloud to local mapping will change the source to STOCK
    if (!cloudData.customPictureId && scene.pictureSource === "CUSTOM") {
      this.transferPromises.push(FileUtil.safeDeleteFile(scene.picture));
    }
    else if (cloudData.customPictureId && cloudData.customPictureId !== scene.pictureId) {
      // if there IS a custom image, but its not the same id as we have, download the new one
      this._downloadSceneImage(cloudData)
    }
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_Scene) {
    let scene = Get.scene(this.localSphereId, this.localId);
    if (!scene) { return null; }
    if (reply.scenes === undefined) {
      reply.scenes = {};
    }
    if (reply.scenes[this.cloudId] === undefined) {
      reply.scenes[this.cloudId] = {};
    }
    reply.scenes[this.cloudId].data = SceneSyncerNext.mapLocalToCloud(scene);


    if (scene.pictureSource === "STOCK" && cloudData.stockPicture === null) {
      this.transferPromises.push(CLOUD.forScene(this.localId).downloadSceneCustomPicture().catch((err) => {}))
    }
  }

  _downloadSceneImage(cloudData: cloud_Scene) {
    if (!cloudData.customPictureId) { return; }

    let toPath = FileUtil.getPath(this.localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forScene(cloudData.id).downloadSceneCustomPicture(toPath)
        .then((picturePath) => {
          this.actions.push({type:'UPDATE_SCENE', sphereId: this.localSphereId, sceneId: this.localId, data:
              { picture: picturePath, pictureId: cloudData.customPictureId, pictureSource: "CUSTOM" }
          });
        })
        .catch((err) => { LOGe.cloud("SceneSyncer: Could not download scene picture to ", toPath, ' err:', err); })
    );
  }
}

