import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";


let fieldMap : fieldMap = [

  { local: 'triggerLocationId',               cloud:'localTriggerLocationId', cloudToLocalOnly: true},
  { local: 'cloudTriggerLocationId',          cloud:'triggerLocationId',      localToCloudOnly: true},
  { local: 'triggerEvent',                    cloud:'triggerEvent'},
  { local: 'content',                         cloud:'content'},
  { local: 'everyoneInSphere',                cloud:'everyoneInSphere'},
  { local: 'everyoneInSphereIncludingOwner',  cloud:'everyoneInSphereIncludingOwner'},
  { local: 'senderId',                        cloud:'ownerId'},
  { local: 'updatedAt',                       cloud:'updatedAt'},

  { local: 'cloudId',                         cloud: 'id' ,  cloudToLocalOnly: true },
  { local: 'sendFailed',                      cloud: null },
  { local: 'sent',                            cloud: null },
  { local: 'sentAt',                          cloud: null },
];

export const transferMessages = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudData ) {
    let payload = {};
    payload['sphereId'] = data.cloudSphereId;

    let localConfig = data.localData.config;

    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.forSphere(data.cloudSphereId).createMessage(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_MESSAGE_CLOUD_ID', sphereId: data.localSphereId, messageId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Message: Could not create Message in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'ADD_CLOUD_MESSAGE',
      { sphereId: data.localSphereId, messageId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalData) {
    transferUtil._handleLocal(
      actions,
      'APPEND_MESSAGE',
      { sphereId: data.localSphereId, messageId: data.localId },
      data,
      fieldMap
    );
  },

};