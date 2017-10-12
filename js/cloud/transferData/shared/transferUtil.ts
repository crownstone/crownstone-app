export const transferUtil = {
  fillFieldsForCloud: function(payload, localData, fieldMap) {
    fieldMap.forEach((field) => {
      if (field.cloudToLocalOnly === true) {
        return; // we do not allow this field to be synced back up to the cloud. Usually used for IDs.
      }

      if (field.permissionNeeded && payload.permissionGranted === false) {
        return;
      }

      if (localData[field.local] !== undefined && field.cloud !== null) {
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

      if (field.cloud !== null && cloudData[field.cloud]) {
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


  _handleLocal: function(actions, type, ids, data: any, fieldMap: fieldMap) {
    return new Promise((resolve, reject) => {
      if (!data.cloudData) {
        reject("Transfer: No cloud data available! Tried: " + type);
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
        type: type,
        data: payload,
        ...ids
      };

      actions.push(actionPayload);

      resolve();
    })
  }
};

