import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import {Get} from "../../../../util/GetUtil";


export const MessageDeletedTransferNext : TransferMessageTool<MessageStateData, MessageStateData, cloud_MessageState, cloud_MessageState_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: MessageStateData) : cloud_MessageState_settable {
    let result : cloud_MessageState_settable = {
      userId:    Get.userId(),
      updatedAt: new Date(localData.updatedAt).toISOString()
    };
    return result;
  },


   mapCloudToLocal(cloudMessage: cloud_MessageState) : Partial<MessageStateData> {
    let result : Partial<MessageStateData> = {
      cloudId:   cloudMessage.id,
      value:     Get.userId() === cloudMessage.userId,
      updatedAt: new Date(cloudMessage.updatedAt).valueOf(),
    };
    return result;
  },


  getCreateLocalAction(localSphereId: string, localMessageId: string, data: Partial<MessageStateData>) : {id: string, action: DatabaseAction } {
    let newId = 'deleted';
    let action : DatabaseAction = {type:"MARK_AS_DELETED", sphereId: localSphereId, messageId: localMessageId, messageStateId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localMessageId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_DELETE_MESSAGE_CLOUD_ID", sphereId: localSphereId, messageId: localMessageId, messageStateId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localMessageId: string, localItemId: string, data: Partial<MessageStateData>) : DatabaseAction {
    return {type:"UPDATE_DELETE_MESSAGE", sphereId: localSphereId, messageId: localMessageId, messageStateId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localMessageId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_MESSAGE_DELETED", sphereId: localSphereId, messageId: localMessageId, messageStateId: localItemId }
  },


  async createOnCloud(localSphereId: string, localMessageId: string, data: MessageStateData) : Promise<cloud_MessageState> {
    let cloudItem = await CLOUD.markMessageAsDeleted(localMessageId);
    core.store.dispatch(MessageDeletedTransferNext.getUpdateLocalCloudIdAction(localSphereId, localMessageId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: MessageStateData) : Promise<void> {
    throw new Error("Can not update message after sending.")
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    throw new Error("Can unread message after reading.")
  },


  createLocal(localSphereId: string, localMessageId: string, data: Partial<any>) {
    let newItemData = MessageDeletedTransferNext.getCreateLocalAction(localSphereId, localMessageId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

