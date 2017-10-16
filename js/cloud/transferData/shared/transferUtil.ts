export const transferUtil = {
  fillFieldsForCloud: function(payload, localData, fieldMap) {
    fieldMap.forEach((field) => {
      if (field.cloudToLocalOnly === true) {
        return; // we do not allow this field to be synced back up to the cloud. Usually used for IDs.
      }

      if (field.permissionNeeded && payload.permissionGranted === false) {
        return; // no permission to sync this data up.
      }

      if (field.cloud === null) {
        return; // this field will not be synced up.
      }

      if (localData[field.local] !== undefined) {
        if (field.localFields) {
          payload[field.cloud] = {};
          for (let i = 0; i < field.localFields.length; i++) {
            payload[field.cloud][field.cloudFields[i]] = localData[field.local][field.localFields[i]]
          }
        }
        else {
          payload[field.cloud] = localData[field.local]
        }
      }
    })
  },


  fillFieldsForLocal: function(payload, cloudData, fieldMap) {
    fieldMap.forEach((field) => {
      if (field.localToCloudOnly === true) {
        return; // we do not allow this field to be synced from the cloud to local. Usually used for IDs.
      }

      if (field.cloud === null) {
        return; // this field will not be synced down.
      }

      // fields that do not exists in the cloud will be listen null
      if (cloudData[field.cloud] === undefined) {
        payload[field.local] = null;
      }
      else {
        // if we HAVE cloud data, put it in the local data.
        if (field.cloudFields) {
          payload[field.local] = {};
          for (let i = 0; i < field.cloudFields.length; i++) {
            payload[field.local][field.cloudFields[i]] = cloudData[field.cloud][field.cloudFields[i]]
          }
        }
        else {
          payload[field.local] = cloudData[field.cloud]
        }
      }
    })
  },


  _handleLocal: function(actions, actionType, ids, data: any, fieldMap: fieldMap) {
    return new Promise((resolve, reject) => {
      if (!data.cloudData) {
        reject("Transfer: No cloud data available! Tried: " + actionType);
      }

      let payload = {};
      transferUtil.fillFieldsForLocal(payload, data.cloudData, fieldMap);

      // add optional extra fields to payload
      if (data.extraFields) {
        let extraFieldKeys = Object.keys(data.extraFields);
        extraFieldKeys.forEach((extraFieldKey) => {
          payload[extraFieldKey] = data.extraFields[extraFieldKey];
        })
      }

      let actionPayload = {
        type: actionType,
        data: payload,
        ...ids
      };

      actions.push(actionPayload);

      resolve();
    })
  }
};

