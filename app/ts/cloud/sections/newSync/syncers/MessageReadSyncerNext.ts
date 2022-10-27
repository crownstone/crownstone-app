import { Get } from "../../../../util/GetUtil";
import { SyncUtil } from "../../../../util/SyncUtil";
import {SyncMessageInterface} from "./base/SyncMessageInterface";
import { MessageReadID, MessageReadTransferNext } from "../transferrers/MessageReadTransferNext";



export class MessageReadSyncerNext extends SyncMessageInterface<MessageStateData, MessageStateData, cloud_MessageState, cloud_MessageState_settable> {

  constructor(options: SyncInterfaceOptions, cloudMessageId: string) {
    super(MessageReadTransferNext, options, cloudMessageId);
  }

  getLocalId() {
    return MessageReadID;
  }

  createLocal(cloudData: cloud_MessageState) {
    let newData = MessageReadTransferNext.getCreateLocalAction(
      this.localSphereId,
      this.localMessageId,
      MessageReadTransferNext.mapCloudToLocal(cloudData)
    );
    this.actions.push(newData.action)
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let message = Get.message(this.localSphereId, this.localMessageId);
    if (!message) { return null; }

    if (!message.read?.[MessageReadID]) { return null; }

    SyncUtil.constructReply(
      reply,
      ['messages', this.cloudMessageId, 'readBy', this.cloudId],
      MessageReadTransferNext.mapLocalToCloud(message.read[MessageReadID])
    );
  }
}

