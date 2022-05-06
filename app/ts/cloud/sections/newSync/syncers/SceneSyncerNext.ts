import {MapProvider} from "../../../../backgroundProcesses/MapProvider";
import {Get} from "../../../../util/GetUtil";
import {CLOUD} from "../../../cloudAPI";
import {FileUtil} from "../../../../util/FileUtil";
import {LOGe} from "../../../../logging/Log";
import {SyncSphereInterface} from "./base/SyncSphereInterface";
import {SceneTransferNext} from "../transferrers/SceneTransferNext";
import {SyncNext} from "../SyncNext";
import {SyncUtil} from "../../../../util/SyncUtil";


export class SceneSyncerNext extends SyncSphereInterface<SceneData, SceneData, cloud_Scene, cloud_Scene_settable> {

  constructor(options: SyncInterfaceOptions) {
    super(SceneTransferNext, options);
  }


  getLocalId() {
    return this.globalCloudIdMap.scenes[this.cloudId] || MapProvider.cloud2localMap.scenes[this.cloudId];
  }


  createLocal(cloudData: cloud_Scene) {
    let newData = SceneTransferNext.getCreateLocalAction(this.localSphereId, SceneTransferNext.mapCloudToLocal(cloudData));
    this.actions.push(newData.action);
    this.globalCloudIdMap.scenes[this.cloudId] = newData.id;

    if (cloudData.customPictureId) {
      this._downloadSceneImage(cloudData);
    }
  }

  updateLocal(cloudData: cloud_Scene) {
    this.actions.push(
      SceneTransferNext.getUpdateLocalAction(this.localSphereId, this.localId, SceneTransferNext.mapCloudToLocal(cloudData))
    );
    // check if we have to do things with the image
    let scene = Get.scene(this.localSphereId, this.localId);
    // if there is no image on the cloud, but we expect a custom image, delete our custom image
    // the cloud to local mapping will change the source to STOCK
    if (!cloudData.customPictureId && scene.pictureSource === "CUSTOM") {
      this.transferPromises.push(FileUtil.safeDeleteFile(scene.picture));
    }
    else if (cloudData.customPictureId !== scene.pictureId || cloudData.customPictureId && !scene.picture) {
      // if there IS a custom image, but its not the same id as we have, download the new one
      this._downloadSceneImage(cloudData)
    }
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_Scene) {
    let scene = Get.scene(this.localSphereId, this.localId);
    if (!scene) { return null; }
    SyncUtil.constructReply(reply,['scenes', this.cloudId],
      SceneTransferNext.mapLocalToCloud(scene)
    );

    // the actual uploading of the image is not done in the syncer, this is done with a syncEvent (see the cloudEnhancer and the syncEvents.ts)
    if (scene.pictureSource === "STOCK" && cloudData.stockPicture === null) {
      this.transferPromises.push(CLOUD.forScene(this.localId).downloadSceneCustomPicture().catch((err) => {}));
    }
  }

  _downloadSceneImage(cloudData: cloud_Scene) {
    if (!cloudData.customPictureId) { return; }

    let localId = this.getLocalId();
    let toPath = FileUtil.getPath(localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forScene(cloudData.id).downloadSceneCustomPicture(toPath)
        .then((picturePath) => {
          this.actions.push({type:'UPDATE_SCENE', sphereId: this.localSphereId, sceneId: localId, data:
              { picture: picturePath, pictureId: cloudData.customPictureId, pictureSource: "CUSTOM" }
          });
        })
        .catch((err) => { LOGe.cloud("SceneSyncer: Could not download scene picture to ", toPath, ' err:', err?.message); })
    );
  }


  static prepare(sphere: SphereData) : {[itemId:string]: RequestItemCoreType} {
    return SyncNext.gatherRequestData(sphere,{key:'scenes', type:'scene'});
  }
}

