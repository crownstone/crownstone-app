import { xUtil } from "../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { CLOUD } from "../../../cloudAPI";
import { core } from "../../../../Core";


export const MessageTransferNext : TransferSphereTool<MessageData, MessageData, cloud_Message, cloud_Message_settable> = {

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  mapLocalToCloud(localData: MessageData) : cloud_Message_settable {
    let result : cloud_Message_settable = {
      triggerEvent:            localData.triggerEvent,
      content:                 localData.content,
      everyoneInSphere:        localData.everyoneInSphere,
      includeSenderInEveryone: localData.includeSenderInEveryone,
      triggerLocationId:       MapProvider.local2cloudMap.locations[localData.triggerLocationId] || localData.triggerLocationId,
      updatedAt:               new Date(localData.updatedAt).toISOString()
    };
    return result;
  },


   mapCloudToLocal(cloudMessage: cloud_Message) : Partial<MessageData> {
    let result : Partial<MessageData> = {
      cloudId:                 cloudMessage.id,
      triggerLocationId:       cloudMessage.triggerLocationId,
      triggerEvent:            cloudMessage.triggerEvent as MessageTriggerEvent,
      everyoneInSphere:        cloudMessage.everyoneInSphere,
      includeSenderInEveryone: cloudMessage.includeSenderInEveryone,
      content:                 cloudMessage.content,
      senderId:                cloudMessage.ownerId,
      sentAt:                  new Date(cloudMessage.createdAt).valueOf(),
      updatedAt:               new Date(cloudMessage.updatedAt).valueOf(),
    };

    if (cloudMessage.recipients) {
      result.recipients = xUtil.arrayToMap(cloudMessage.recipients.map(r => r.userId));
    }

    return result;
  },


  getCreateLocalAction(localSphereId: string, data: Partial<MessageData>) : {id: string, action: DatabaseAction } {
    let newId = xUtil.generateLocalId();
    let action : DatabaseAction = {type:"ADD_MESSAGE", sphereId: localSphereId, messageId: newId, data: data };
    return {id: newId, action};
  },


  getUpdateLocalCloudIdAction(localSphereId: string, localItemId: string, cloudId: string) : DatabaseAction {
    return {type:"UPDATE_MESSAGE_CLOUD_ID", sphereId: localSphereId, messageId: localItemId, data: {cloudId}};
  },


  getUpdateLocalAction(localSphereId: string, localItemId: string, data: Partial<MessageData>) : DatabaseAction {
    return {type:"UPDATE_READ_MESSAGE", sphereId: localSphereId, messageId: localItemId, data: data }
  },


  getRemoveFromLocalAction(localSphereId: string, localItemId: string) : DatabaseAction {
    return {type:"REMOVE_MESSAGE", sphereId: localSphereId, messageId: localItemId };
  },


  async createOnCloud(localSphereId: string, data: MessageData) : Promise<cloud_Message> {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    let cloudItem = await CLOUD.forSphere(cloudSphereId).createMessage(MessageTransferNext.mapLocalToCloud(data));
    core.store.dispatch(MessageTransferNext.getUpdateLocalCloudIdAction(localSphereId, data.id, cloudItem.id));
    return cloudItem;
  },


  async updateOnCloud(localSphereId: string, data: MessageData) : Promise<void> {
    throw new Error("Can not update message after sending.")
  },


  async removeFromCloud(localSphereId: string, localId: string) : Promise<void> {
    await CLOUD.deleteMessage(localId);
  },


  createLocal(localSphereId: string, data: Partial<any>) {
    let newItemData = MessageTransferNext.getCreateLocalAction(localSphereId, data);
    core.store.dispatch(newItemData.action);
    return newItemData.id;
  }
}

