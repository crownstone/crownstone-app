/**
 *
 * Sync the user from the cloud to the database.
 *
 */

import { shouldUpdateInCloud, shouldUpdateLocally} from "../shared/syncUtil";

import { CLOUD}               from "../../../cloudAPI";
import { SyncingBase }        from "./SyncingBase";
import {transferUser} from "../../../transferData/transferUser";
import {LOGe} from "../../../../logging/Log";
import { FileUtil } from "../../../../util/FileUtil";

export class UserSyncer extends SyncingBase {
  userId : string;

  download() {
    return CLOUD.forUser(this.userId).getUserData()
  }

  sync(store) {
    let state = store.getState();
    this.userId = state.user.userId;

    return this.download()
      .then((userData) => {
        let userInState = store.getState().user;
        this.syncDown(userInState, userData);
        return Promise.all(this.transferPromises);
      })
      .then(() => { return this.actions });
  }

  syncDown(userInState, userInCloud) {
    if (userInCloud.profilePicId && userInState.picture === null || (userInCloud.profilePicId && (userInCloud.profilePicId !== userInState.pictureId))) {
      // user should have A or A DIFFERENT profile picture according to the cloud
      let toPath = FileUtil.getPath(this.userId + '.jpg');
      this.transferPromises.push(
        CLOUD.downloadProfileImage(toPath)
          .then((picturePath) => {
            this.actions.push({type:'USER_APPEND', data:{ picture: picturePath, pictureId: userInCloud.profilePicId }});
          }).catch((err) => { LOGe.cloud("UserSyncer: Could not download profile picture to ", toPath, ' err:', err); })
      );
    }

    if (shouldUpdateLocally(userInState, userInCloud)) {
      transferUser.updateLocal(this.actions, {cloudData: userInCloud});
    }
    else if (shouldUpdateInCloud(userInState, userInCloud)) {
      this.transferPromises.push(transferUser.updateOnCloud({localData: userInState, cloudId: userInCloud.id}));
    }
  }

}
