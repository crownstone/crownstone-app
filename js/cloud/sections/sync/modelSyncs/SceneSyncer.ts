/**
 * Sync the scenes from the cloud to the database.
 */

import {shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";
import {CLOUD} from "../../../cloudAPI";
import {SyncingSphereItemBase} from "./SyncingBase";
import {LOGe, LOGw} from "../../../../logging/Log";
import {Permissions} from "../../../../backgroundProcesses/PermissionManager";
import { xUtil } from "../../../../util/StandAloneUtil";
import { transferScenes } from "../../../transferData/transferScenes";
import { FileUtil } from "../../../../util/FileUtil";
import { PICTURE_GALLERY_TYPES } from "../../../../views/scenesViews/ScenePictureGallery";

export class SceneSyncer extends SyncingSphereItemBase {

  download() {
    return CLOUD.forSphere(this.cloudSphereId).getScenesInSphere()
  }

  _getLocalData(store) {
    let state = store.getState();
    if (state && state.spheres[this.localSphereId]) {
      return state.spheres[this.localSphereId].scenes;
    }
    return {};
  }

  sync(store) {
    return this.download()
      .then((scenesInCloud) => {
        let scenesInState = this._getLocalData(store);
        let localSceneIdsSynced = this.syncDown(scenesInState, scenesInCloud);
        this.syncUp(store, scenesInState, localSceneIdsSynced);

        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(scenesInState, scenesInCloud) : object {
    let localSceneIdsSynced = {};
    let cloudIdMap = this._getCloudIdMap(scenesInState);

    // go through all scenes in the cloud.
    scenesInCloud.forEach((scene_from_cloud) => { // underscores so its visually different from scenesInState
      let localId = cloudIdMap[scene_from_cloud.id];

      // if we do not have a scenes with exactly this cloudId, verify that we do not have the same scenes on our device already.
      if (localId === undefined) {
        localId = this._searchForLocalMatch(scenesInState, scene_from_cloud);
      }

      // item exists locally.
      if (localId) {
        localSceneIdsSynced[localId] = true;
        this.syncLocalScenesDown(localId, scenesInState[localId], scene_from_cloud);
      }
      else {
        console.log("CREATE!", scene_from_cloud)
        // the scenes does not exist locally but it does exist in the cloud.
        // we create it locally.
        localId = xUtil.getUUID();
        transferScenes.createLocal(this.actions, {
          localId: localId,
          localSphereId: this.localSphereId,
          cloudData: scene_from_cloud
        });

        // download image
        this._downloadScenesImage(localId, scene_from_cloud.id, scene_from_cloud.customPictureId);
      }

      cloudIdMap[scene_from_cloud.id] = localId;
    });

    this.globalSphereMap.scenes = {...this.globalSphereMap.scenes, ...cloudIdMap};
    this.globalCloudIdMap.scenes = {...this.globalCloudIdMap.scenes, ...cloudIdMap};
    return localSceneIdsSynced;
  }


  syncUp(store, scenesInState, localSceneIdsSynced) {
    let localSceneIds = Object.keys(scenesInState);

    localSceneIds.forEach((sceneId) => {
      let scene = scenesInState[sceneId];
      this.syncLocalScenesUp(
        store,
        scene,
        sceneId,
        localSceneIdsSynced[sceneId] === true
      )
    });
  }


  syncLocalScenesUp(store, localScene, localSceneId, hasSyncedDown = false) {
    // if the object does not have a cloudId, it does not exist in the cloud but we have it locally.
    if (!hasSyncedDown) {
      if (localScene.cloudId) {
        this.actions.push({ type: 'REMOVE_SCENE', sphereId: this.localSphereId, sceneId: localSceneId });
        this.propagateRemoval(localScene);
      }
      else {
        if (!Permissions.inSphere(this.localSphereId).canCreateScenes) { return }
        this.transferPromises.push(
          transferScenes.createOnCloud(this.actions, { localId: localSceneId, localSphereId: this.localSphereId, cloudSphereId: this.cloudSphereId, localData: localScene })
            .then((cloudId) => {
              this.globalCloudIdMap.scenes[cloudId] = localSceneId;
            })
        );
      }
    }
  }

  propagateRemoval(localScene) {
    if (localScene.pictureSource === PICTURE_GALLERY_TYPES.CUSTOM && localScene.picture) {
      FileUtil.safeDeleteFile(localScene.picture);
    }
  }

  _downloadScenesImage(localId, cloudId, imageId) {
    if (!imageId) { return; }

    let toPath = FileUtil.getPath(localId + '.jpg');
    this.transferPromises.push(
      CLOUD.forScene(cloudId).downloadSceneCustomPicture(toPath)
        .then((picturePath) => {
          this.actions.push({type:'UPDATE_SCENE', sphereId: this.localSphereId, sceneId: localId, data:{ picture: picturePath, pictureId: imageId, pictureSource: PICTURE_GALLERY_TYPES.CUSTOM }});
        }).catch((err) => { LOGe.cloud("ScenesSyncer: Could not download scenes picture to ", toPath, ' err:', err); })
    );
  }

  syncLocalScenesDown(localId, sceneInState, scene_from_cloud) {
    if (scene_from_cloud.customPictureId && sceneInState.pictureId === null || (scene_from_cloud.customPictureId && (scene_from_cloud.customPictureId !== sceneInState.pictureId))) {
      // user should have A or A DIFFERENT profile picture according to the cloud
      this._downloadScenesImage(localId, scene_from_cloud.id,  scene_from_cloud.customPictureId);
    }

    if (shouldUpdateInCloud(sceneInState, scene_from_cloud)) {
      if (!Permissions.inSphere(this.localSphereId).canUploadScenes) { return }

      this.transferPromises.push(
        transferScenes.updateOnCloud({
          localId:   localId,
          localData: sceneInState,
          localSphereId: this.localSphereId,
          cloudSphereId: this.cloudSphereId,
          cloudId:   scene_from_cloud.id,
        })
          .catch(() => {})
      );
    }
    else if (shouldUpdateLocally(sceneInState, scene_from_cloud)) {
      transferScenes.updateLocal(this.actions, {
        localId:   localId,
        localSphereId: this.localSphereId,
        cloudData: scene_from_cloud
      })
    }

    if (!sceneInState.cloudId) {
      this.actions.push({type:'UPDATE_SCENE_CLOUD_ID', sphereId: this.localSphereId, sceneId: localId, data:{cloudId: scene_from_cloud.id}})
    }
  };


  _getCloudIdMap(scenesInState) {
    let cloudIdMap = {};
    let sceneIds = Object.keys(scenesInState);
    sceneIds.forEach((sceneId) => {
      let scenes = scenesInState[sceneId];
      if (scenes.cloudId) {
        cloudIdMap[scenes.cloudId] = sceneId;
      }
    });

    return cloudIdMap;
  }

  _searchForLocalMatch(scenesInState, scene_in_cloud) {
    let sceneIds = Object.keys(scenesInState);
    for (let i = 0; i < sceneIds.length; i++) {
      if (scenesInState[sceneIds[i]].cloudId === scene_in_cloud.id) {
        return sceneIds[i];
      }
    }
    console.log("could not find a match", scenesInState, scene_in_cloud)
    return null;
  }
}
