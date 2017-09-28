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
  {local:'cloudId',             cloud:  null },
];

export const transferSpheres = {

  updateOnCloud: function( actions, data : transferData ) {
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

  createLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'ADD_SPHERE',
      { sphereId: data.sphereId },
      data,
      fieldMap
    );
  },

  updateLocal: function( actions, data: transferData) {
    return transferUtil._handleLocal(
      actions,
      'UPDATE_SPHERE_CONFIG',
      { sphereId: data.sphereId },
      data,
      fieldMap
    );
  },

};