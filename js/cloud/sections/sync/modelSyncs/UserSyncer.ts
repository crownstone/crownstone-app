/**
 *
 * Sync the user from the cloud to the database.
 *
 */

import { shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";

import { CLOUD}               from "../../../cloudAPI";
import { SyncingBase }        from "./SyncingBase";
import {Util} from "../../../../util/Util";
import {transferUser} from "../../../transferData/transferUser";

export class UserSyncer extends SyncingBase {
  userId : string;

  download() {
    return CLOUD.getUserData()
  }

  sync(store) {
    let state = store.getState();
    this.userId = state.user.userId;

    return this.download()
      .then((userData) => {
        let userInState = store.getState().user;
        this.syncDown(userInState, userData);
        this.syncUp(userInState, userData);
        return CLOUD.getKeys()
      })
      .then((keys) => {
        this.syncKeys(keys);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncUp(userInState, userInCloud) {

  }

  syncDown(userInState, userInCloud) {
    if (userInCloud.profilePicId && userInState.picture === null || (userInCloud.profilePicId && (userInCloud.profilePicId !== userInState.pictureId))) {
      // user should have A or A DIFFERENT profile picture according to the cloud
      let toPath = Util.getPath(this.userId + '.jpg');
      this.transferPromises.push(
        CLOUD.downloadProfileImage(toPath)
          .then((picturePath) => {
            this.actions.push({type:'USER_APPEND', data:{ picture: picturePath, pictureId: userInCloud.profilePicId }});
          }).catch()
      );
    }

    let cloudFirmwareVersions = userInCloud.firmwareVersionsAvailable || null;
    let cloudBootloaderVersions = userInCloud.bootloaderVersionsAvailable || null;

    if (
      userInState && cloudFirmwareVersions && cloudBootloaderVersions &&
      (userInState.firmwareVersionsAvailable !== cloudFirmwareVersions || userInState.bootloaderVersionsAvailable !== cloudBootloaderVersions)
    ) {
      this.actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {firmwareVersionsAvailable: cloudFirmwareVersions, bootloaderVersionsAvailable: cloudBootloaderVersions}})
    }

    if (shouldUpdateLocally(userInState, userInCloud)) {
      this.transferPromises.push(transferUser.updateLocal(this.actions, {cloudData: userInCloud}));
    }
    else if (shouldUpdateInCloud(userInState, userInCloud)) {
      this.transferPromises.push(transferUser.updateOnCloud({localData: userInState, cloudId: userInCloud.id}));
    }
  }

  syncKeys(keys) {
    keys.forEach((keySet) => {
      this.actions.push({type:'SET_SPHERE_KEYS', sphereId: keySet.sphereId, data:{
        adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
        memberKey: keySet.keys.member || null,
        guestKey:  keySet.keys.guest  || null
      }})
    })
  }

}
