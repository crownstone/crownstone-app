export const changeEvents = {

  getLocationDeleteEvent: function (sphereId, locationId) {
    return this._getDeleteChangeEvent("Location", sphereId, locationId);
  },

  getStoneDeleteEvent: function (sphereId, stoneId) {
    return this._getDeleteChangeEvent("Stone", sphereId, stoneId);
  },

  getMessageDeleteEvent: function (sphereId, messageId) {
    return this._getDeleteChangeEvent("Message", sphereId, messageId);
  },

  getScheduleDeleteEvent: function (sphereId, scheduleId) {
    return this._getDeleteChangeEvent("Schedule", sphereId, scheduleId);
  },

  getApplianceDeleteEvent: function (sphereId, applianceId) {
    return this._getDeleteChangeEvent("Appliance", sphereId, applianceId);
  },

  _getDeleteChangeEvent: function(model, sphereId, itemId) {
    return this._setupRequest('GET', '/Changes', { data:{
      filter:{
        where:{
          and:[
            {model:     model},
            {type:      'DELETE'},
            {sphereId:  sphereId},
            {itemId:    itemId},
          ]
        }
      }
    }});
  }
};