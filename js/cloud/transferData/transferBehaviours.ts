import { CLOUD }        from "../cloudAPI";
import {LOGe} from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";

let fieldMap : fieldMap = [

  {local: 'type',               cloud:'type'},
  {local: 'data',               cloud:'data'},
  {local: 'deleted',            cloud:'deleted' },
  {local: 'idOnCrownstone',     cloud:'idOnCrownstone', onlyIfValue:true },
  {local: 'syncedToCrownstone', cloud:'syncedToCrownstone' },
  {local: 'updatedAt',          cloud:'updatedAt'},
  {local: 'activeDays',         cloud:'activeDays'},
  {local: 'profileIndex',       cloud:'profileIndex'},

  // used for local config
  {local: 'cloudId',            cloud:  'id',  cloudToLocalOnly: true  },
];

export const transferBehaviours = {
  fieldMap: fieldMap,

  createOnCloud: function( actions, data : transferNewToCloudStoneData ) {
    let payload = {};
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
    payload['sphereId'] = data.cloudSphereId;
    return CLOUD.forStone(data.cloudStoneId).createBehaviour(payload)
      .then((result) => {
        // update cloudId in local database.
        actions.push({type: 'UPDATE_RULE_CLOUD_ID', sphereId: data.localSphereId, stoneId: data.localStoneId, ruleId: data.localId, data: { cloudId: result.id }});
      })
      .catch((err) => {
        LOGe.cloud("Transfer-Behaviour: Could not create Behaviour in cloud", err);
        throw err;
      });
  },

  updateOnCloud: function( data : transferToCloudStoneData ) {
    if (data.cloudId === undefined) {
      return Promise.reject({status: 404, message:"Can not update in cloud, no cloudId available"});
    }

    let payload = {};
    transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
    payload['sphereId'] = data.cloudSphereId;

    return CLOUD.forStone(data.cloudStoneId).updateBehaviour(data.cloudId, payload)
      .catch((err) => {
        LOGe.cloud("Transfer-Stone: Could not update Behaviour in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalStoneData) {
    transferUtil._handleLocal(
      actions,
      'ADD_STONE_RULE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, ruleId: data.localId },
      data,
      fieldMap
    );
  },


  updateLocal: function( actions, data: transferToLocalStoneData) {
    transferUtil._handleLocal(
      actions,
      'UPDATE_STONE_RULE',
      { sphereId: data.localSphereId, stoneId: data.localStoneId, ruleId: data.localId },
      data,
      fieldMap
    );
  },
};