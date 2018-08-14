// import { CLOUD }        from "../cloudAPI";
// import { LOGe }         from "../../logging/Log";
// import { transferUtil } from "./shared/transferUtil";
//
// let fieldMap : fieldMap = [
//   { local: 'property',  cloud: 'property'  },
//   { local: 'value',     cloud: 'value'     },
//   { local: 'updatedAt', cloud: 'updatedAt' },
//   { local: 'cloudId',   cloud: 'id' , cloudToLocalOnly: true },
// ];
//
// type transferPreferenceToCloudData = {
//   localId: string,
//   localData: any,
//   cloudDeviceId: string,
//   cloudId: string,
// }
//
// export const transferPreferences = {
//   fieldMap: fieldMap,
//
//   createOnCloud: function( actions, data : transferNewToCloudPreferenceData ) {
//     let payload = {};
//     transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
//
//     return CLOUD.forDevice(data.cloudDeviceId).createPreference(payload)
//       .then((result) => {
//         // update cloudId in local database.
//         actions.push({type: 'UPDATE_PREFERENCE_CLOUD_ID', preferenceId: data.localId, data: { cloudId: result.id }});
//         return result.id;
//       })
//       .catch((err) => {
//         LOGe.cloud("Transfer-Preference: Could not create Preference in cloud", err);
//         throw err;
//       });
//   },
//
//   updateOnCloud: function( data : transferPreferenceToCloudData ) {
//     if (data.cloudId === undefined) {
//       return new Promise((resolve,reject) => { reject({status: 404, message:"Can not update in cloud, no cloudId available"}); });
//     }
//
//     let payload = {};
//     transferUtil.fillFieldsForCloud(payload, data.localData, fieldMap);
//
//     return CLOUD.forDevice(data.cloudDeviceId).updatePreference(data.cloudId, payload)
//       .catch((err) => {
//         LOGe.cloud("Transfer-Preference: Could not update preference in cloud", err);
//         throw err;
//       });
//   },
//
//
//   createLocal: function( actions, data: transferToLocalPreferenceData) {
//     return transferUtil._handleLocal(
//       actions,
//       'ADD_PREFERENCE',
//       { preferenceId: data.localId },
//       data,
//       fieldMap
//     );
//   },
//
//
//   updateLocal: function( actions, data: transferToLocalPreferenceData) {
//     return transferUtil._handleLocal(
//       actions,
//       'UPDATE_PREFERENCE',
//       { preferenceId: data.localId },
//       data,
//       fieldMap
//     );
//   },
//
// };