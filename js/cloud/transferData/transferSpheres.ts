import { CLOUD }        from "../cloudAPI";
import { LOG }          from "../../logging/Log";
import { transferUtil } from "./shared/transferUtil";



let fieldMap : fieldMap = [
  {local:'name',                cloud: 'name'},
  {local:'aiName',              cloud: 'aiName'},
  {local:'aiSex',               cloud: 'aiSex'},
  {local:'latitude' ,           cloud: 'latitude'},
  {local:'longitude',           cloud: 'longitude'},
  {local:'exitDelay',           cloud: 'exitDelay'},
  {local:'iBeaconUUID',         cloud: 'uuid'},
  {local:'meshAccessAddress',   cloud: 'meshAccessAddress'},
  {local:'updatedAt',           cloud: 'updatedAt'},

  // keys are set elsewhere
  {local:'adminKey',            cloud:  null },
  {local:'memberKey',           cloud:  null },
  {local:'guestKey',            cloud:  null },

  // used for local
  {local:'cloudId',             cloud:  'id',  cloudToLocalOnly: true  },
];

export const transferSpheres = {

  updateOnCloud: function( actions, data : transferToCloudData ) {
    if (data.cloudId === undefined) {
      return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
    }

    let payload = {};
    let localConfig = data.localData.config;
    transferUtil.fillFieldsForCloud(payload, localConfig, fieldMap);

    return CLOUD.updateSphere(data.cloudId, payload)
      .then(() => {})
      .catch((err) => {
        LOG.error("Transfer-Sphere: Could not update sphere in cloud", err);
        throw err;
      });
  },

  createLocal: function( actions, data: transferToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_SPHERE',
      { sphereId: data.sphereId },
      data,
      fieldMap
    );
  },

  updateLocal: function( actions, data: transferToLocalData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_SPHERE_CONFIG',
      { sphereId: data.sphereId },
      data,
      fieldMap
    );
  },

};