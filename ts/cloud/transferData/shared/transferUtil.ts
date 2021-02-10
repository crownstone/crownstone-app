export const transferUtil = {
  fillFieldsForCloud: function(payload, localData, fieldMap) {
    fieldMap.forEach((field) => {
      if (field.cloudToLocalOnly === true) {
        return; // we do not allow this field to be synced back up to the cloud. Usually used for IDs.
      }

      if (field.cloud === null) {
        return; // this field will not be synced up.
      }

      // if the data exists locally, upload to cloud.
      if (localData[field.local] !== undefined) {
        if (localData[field.local] !== null && field.onlyIfValue || !field.onlyIfValue) {
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
  }
};

