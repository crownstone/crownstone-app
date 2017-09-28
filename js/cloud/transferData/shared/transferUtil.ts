export const transferUtil = {
  fillFieldsForCloud: function(payload, localData, fieldMap) {
    fieldMap.forEach((field) => {
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
      if (field.cloud !== null && cloudData[field.cloud]) {
        if (field.localFields) {
          payload[field.local] = {};
          for (let i = 0; i < field.localFields.length; i++) {
            payload[field.local][field.localFields[i]] = cloudData[field.cloud][field.cloudFields[i]]
          }
        }
        else {
          payload[field.local] = cloudData[field.cloud]
        }
      }
    })
  },


  _handleLocal: function(actions, type, ids, data: transferData, fieldMap: fieldMap) {
    return new Promise((resolve, reject) => {
      if (!data.cloudData) {
        reject("Transfer: No cloud data available! Tried: " + type);
      }

      let payload = {};
      payload['cloudId'] = data.cloudData.id;
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

