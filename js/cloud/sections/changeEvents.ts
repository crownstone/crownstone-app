import {CLOUD} from "../cloudAPI";

export const changeEvents = {

  getLocationDeleteEvent: function (sphereId, locationId) {
    return CLOUD._getDeleteChangeEvent("Location", sphereId, locationId);
  },

  getStoneDeleteEvent: function (sphereId, stoneId) {
    return CLOUD._getDeleteChangeEvent("Stone", sphereId, stoneId);
  },

  getMessageDeleteEvent: function (sphereId, messageId) {
    return CLOUD._getDeleteChangeEvent("Message", sphereId, messageId);
  },

  getScheduleDeleteEvent: function (sphereId, scheduleId) {
    return CLOUD._getDeleteChangeEvent("Schedule", sphereId, scheduleId);
  },

  getApplianceDeleteEvent: function (sphereId, applianceId) {
    return CLOUD._getDeleteChangeEvent("Appliance", sphereId, applianceId);
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