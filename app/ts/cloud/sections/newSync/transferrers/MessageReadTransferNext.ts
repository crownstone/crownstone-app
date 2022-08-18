import { xUtil } from "../../../../util/StandAloneUtil";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";
import {Get} from "../../../../util/GetUtil";

export const MessageReadID = 'read';
export const MessageReadTransferNext : TransferMessageTool<MessageStateData, MessageStateData, cloud_MessageState, cloud_MessageState_settable> = {

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

  // there will only be one entry for read and deleted.
  getCreateLocalAction(localSphereId: string, localMessageId: string, data: Partial<MessageStateData>) : {id: string, action: DatabaseAction } {
    let action : DatabaseAction = {type:"MARK_MESSAGE_AS_READ", sphereId: localSphereId, messageId: localMessageId, messageStateId: MessageReadID, data: data };
    return {id: MessageReadID, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localMessageId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_READ_MESSAGE_CLOUD_ID", sphereId: localSphereId, messageId: localMessageId, messageStateId: MessageReadID, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localMessageId: string, data: Partial<MessageStateData>) : DatabaseAction {
    return {type:"UPDATE_READ_MESSAGE", sphereId: localSphereId, messageId: localMessageId, messageStateId: MessageReadID, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localMessageId: string) : DatabaseAction {
    return {type:"REMOVE_MESSAGE_READ", sphereId: localSphereId, messageId: localMessageId, messageStateId: MessageReadID }
  },


  async createOnCloud(localSphereId: string, localMessageId: string) : Promise<cloud_MessageState> {
    let cloudItem = await CLOUD.markMessageAsRead(localMessageId);
    core.store.dispatch(MessageReadTransferNext.getUpdateLocalCloudIdAction(localSphereId, localMessageId, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: MessageStateData) : Promise<void> {
    throw new Error("Can not update message after sending.")
  },


  async removeFromCloud(localSphereId: string) : Promise<void> {
    throw new Error("Can unread message after reading.")
  },


  createLocal(localSphereId: string, localMessageId: string, data: Partial<any>) {
    let newItemData = MessageReadTransferNext.getCreateLocalAction(localSphereId, localMessageId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

