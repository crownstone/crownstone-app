import { CLOUD } from "../../../cloudAPI";


export const UserTransferNext : TransferTool<UserData, UserData, cloud_User, cloud_User_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: UserData) : cloud_User_settable {
    let result : cloud_User_settable = {
      firstName:           localData.firstName,
      lastName:            localData.lastName,
      email:               localData.email,
      new:                 localData.isNew,
      language:            localData.language,
      uploadLocation:      localData.uploadLocation,
      uploadSwitchState:   localData.uploadSwitchState,
      uploadDeviceDetails: localData.uploadDeviceDetails,
      updatedAt:           new Date(localData.updatedAt).toISOString(),
    };
    return result;
  },


   mapCloudToLocal(cloudUser: cloud_User) : Partial<UserData> {
    let result : Partial<UserData> = {
      firstName:           cloudUser.firstName,
      lastName:            cloudUser.lastName,
      email:               cloudUser.email,
      userId:              cloudUser.id,
      isNew:               cloudUser.new,
      language:            cloudUser.language,
      pictureId:           cloudUser.profilePicId,
      uploadLocation:      cloudUser.uploadLocation,
      uploadSwitchState:   cloudUser.uploadSwitchState,
      uploadDeviceDetails: cloudUser.uploadDeviceDetails,
      updatedAt:           new Date(cloudUser.updatedAt).valueOf()
    };

    return result;
  },

  getCreateLocalAction(data: Partial<UserData>) : {id: string, action: DatabaseAction } {
    throw new Error("UNUSED");
  },

  createLocal(data: Partial<UserData>) {
    throw new Error("UNUSED");
  },

  getRemoveFromLocalAction(localItemId: string)  : DatabaseAction {
    return {type: "NOT_REQUIRED"}
  },

  getUpdateLocalCloudIdAction(localItemId: string, cloudId: string) : DatabaseAction {
    return {type: "NOT_REQUIRED"}
  },

  createOnCloud(userId : string, data: UserData) {
    throw new Error("UNUSED");
  },

  removeFromCloud(localId: string) {
    throw new Error("UNUSED");
  },

  getUpdateLocalAction(localItemId: string, data: Partial<UserData>) : DatabaseAction {
    return {type:"USER_UPDATE", data: data }
  },

  async updateOnCloud(data: UserData) : Promise<void> {
    await CLOUD.forUser(data.userId).updateUserData(UserTransferNext.mapLocalToCloud(data))
  },

}

