import { CLOUD }        from "../cloudAPI";
import { LOG }          from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";


let fieldMap : fieldMap = [

  { local: 'triggerLocationId',               cloud:'triggerLocationId'},
  { local: 'triggerEvent',                    cloud:'triggerEvent'},
  { local: 'content',                         cloud:'content'},
  { local: 'everyoneInSphere',                cloud:'everyoneInSphere'},
  { local: 'everyoneInSphereIncludingOwner',  cloud:'everyoneInSphereIncludingOwner'},
  { local: 'senderId',                        cloud:'ownerId'},
  { local: 'updatedAt',                       cloud:'updatedAt'},

  { local: 'cloudId',                         cloud: null },
  { local: 'sendFailed',                      cloud: null },
  { local: 'sent',                            cloud: null },
  { local: 'sentAt',                          cloud: null },
];

export const transferMessages = {

  createOnCloud: function( actions, data : transferData ) {
    let payload = {};
    payload['sphereId'] = data.sphereId;
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);

    return CLOUD.forSphere(data.sphereId).createMessage(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'APPEND_MESSAGE', sphereId: data.sphereId, messageId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOG.error("Transfer-Message: Could not create Message in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_CLOUD_MESSAGE',
      { sphereId: data.sphereId, messageId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'APPEND_MESSAGE',
      { sphereId: data.sphereId, messageId: data.localId },
      data,
      fieldMap
    );
  },

};