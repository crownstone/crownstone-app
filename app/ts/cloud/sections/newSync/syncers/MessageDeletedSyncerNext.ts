import { Get } from "../../../../util/GetUtil";
import { SyncUtil } from "../../../../util/SyncUtil";
import {SyncMessageInterface} from "./base/SyncMessageInterface";
import { MessageDeletedId, MessageDeletedTransferNext } from "../transferrers/MessageDeletedTransferNext";


export class MessageDeletedSyncerNext extends SyncMessageInterface<MessageStateData, MessageStateData, cloud_MessageState, cloud_MessageState_settable> {

  constructor(options: SyncInterfaceOptions, cloudMessageId: string) {
    super(MessageDeletedTransferNext, options, cloudMessageId);
  }

  getLocalId() {
    return MessageDeletedId;
  }

  createLocal(cloudData: cloud_MessageState) {
    let newData = MessageDeletedTransferNext.getCreateLocalAction(
      this.localSphereId,
      this.localMessageId,
      MessageDeletedTransferNext.mapCloudToLocal(cloudData)
    );
    this.actions.push(newData.action)
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let message = Get.message(this.localSphereId, this.localMessageId);
    if (!message) { return null; }

    if (!message.deleted[MessageDeletedId]) { return null; }

    SyncUtil.constructReply(
      reply,
      ['messages', this.cloudMessageId, 'deletedBy', this.cloudId],
      MessageDeletedTransferNext.mapLocalToCloud(message.deleted[MessageDeletedId])
    );
  }
}

