import {SyncSphereInterface} from "./base/SyncSphereInterface";
import {SyncNext} from "../SyncNext";
import {MapProvider} from "../../../../backgroundProcesses/MapProvider";
import {Get} from "../../../../util/GetUtil";
import {MessageTransferNext} from "../transferrers/MessageTransferNext";
import {SyncUtil} from "../../../../util/SyncUtil";


export class MessageSyncerNext extends SyncSphereInterface<MessageData, MessageData_settable, cloud_Message, cloud_Message_settable> {

  constructor(options: SyncInterfaceOptions) {
    super(MessageTransferNext, options);
  }

  getLocalId(cloudItem: cloud_Message) {
    return this.globalCloudIdMap.messages[this.cloudId] || MapProvider.cloud2localMap.messages[this.cloudId];
  }

  createLocal(cloudData:cloud_Message) {
    let newData = MessageTransferNext.getCreateLocalAction(this.localSphereId, MessageTransferNext.mapCloudToLocal(cloudData))
    this.actions.push(newData.action);
    this.globalCloudIdMap.messages[this.cloudId] = newData.id;
    this.sphereIdMap.messages[this.cloudId] = newData.id;
  }

  setReplyWithData(reply: SyncRequestSphereData, cloudData: cloud_Message) {
    let message = Get.message(this.localSphereId, this.localId);
    if (!message) { return null; }

    SyncUtil.constructReply(reply,['messages', this.cloudId], MessageTransferNext.mapLocalToCloud(message));
  }

  static prepare(sphere: SphereData) : {[itemId:string]: SyncRequestMessageData} {
    let options : GatherOptions = {
      key:'messages', type:'message', children: [
        {key:'read',    type:'readBy',    cloudKey: 'readBy'},
        {key:'deleted', type:'deletedBy', cloudKey: 'deletedBy'}
      ]
    };

    let gatheredData = SyncNext.gatherRequestData(sphere, options);

    for (let cloudMessageId in gatheredData) {
      let item: any = gatheredData[cloudMessageId];
      let message = Get.message(sphere.id, MapProvider.cloud2localMap.messages[cloudMessageId] ?? cloudMessageId);
      if (item.data && message.recipients) {
        item.data.recipients = Object.keys(message.recipients);
      }
    }

    return gatheredData;
  }
}

