
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase } from "./cloudApiBase";
import { CloudAddresses } from "../../backgroundProcesses/indirections/CloudAddresses";



export const messages = {

  createMessage: function (data : cloud_Message_creation, background = true) : Promise<cloud_Message> {
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + 'spheres/{id}/message',
      { data: data, background: background },
      'body'
    );
  },


  getMessages: function (background = true) : Promise<cloud_Message[]>{
    return cloudApiBase._setupRequest(
      'GET',
      CloudAddresses.cloud_v2 + 'spheres/{id}/messages',
      { background: background },
    );
  },


  markMessageAsRead: function (localMessageId, background = true) : Promise<cloud_MessageState> {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId;
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `messages/${cloudMessageId}/markAsRead`,
      { background: background },
    );
  },


  markMessageAsDeleted: function (localMessageId, background = true) : Promise<cloud_MessageState> {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId;
    return cloudApiBase._setupRequest(
      'POST',
      CloudAddresses.cloud_v2 + `messages/${cloudMessageId}/markAsDeleted`,
      { background: background },
    );
  },


  deleteMessage: function (localMessageId, background = true) : Promise<cloud_MessageState> {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId;
    return cloudApiBase._setupRequest(
      'DELETE',
      CloudAddresses.cloud_v2 + 'messages/' + cloudMessageId,
      { background: background }
    );
  },






  // receivedMessage: function (localMessageId, background) {
  //   let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
  //   return cloudApiBase._setupRequest(
  //     'POST',
  //     '/Messages/' + cloudMessageId + '/delivered',
  //     { background: background },
  //     'body'
  //   );
  // },
  //
  // readMessage: function (localMessageId, background) {
  //   let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
  //   return cloudApiBase._setupRequest(
  //     'POST',
  //     '/Messages/' + cloudMessageId + '/read',
  //     { background: background },
  //     'body'
  //   );
  // },
  //
  //
  // getMessage: function (localMessageId, background = true) {
  //   let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
  //   return cloudApiBase._setupRequest(
  //     'GET',
  //     '/Messages/' + cloudMessageId,
  //     { data: {filter:{"include":["recipients","delivered","read"]}}, background: background }
  //   );
  // },
  //
  // getNewMessagesInSphere: function (background = true) {
  //   return cloudApiBase._setupRequest(
  //     'GET',
  //     '/Spheres/{id}/myNewMessages',
  //     { background: background }
  //   );
  // },
  //
  // getAllMessagesInSphere: function (background = true) {
  //   return cloudApiBase._setupRequest(
  //     'GET',
  //     '/Spheres/{id}/myMessages',
  //     { background: background }
  //   );
  // },
  //
  // getNewMessagesInLocation: function (localLocationId, background = true) {
  //   let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
  //   return cloudApiBase._setupRequest(
  //     'GET',
  //     '/Spheres/{id}/myNewMessagesInLocation/' + cloudLocationId,
  //     { background: background }
  //   );
  // },
  //
  // getActiveMessages: function(background = true) {
  //   return cloudApiBase._setupRequest(
  //     'GET',
  //     '/Spheres/{id}/myActiveMessages/',
  //     { background : background }
  //   );
  // },
  //
  // addRecipient: function(recipientId, background = true) {
  //   // recipientId is a userId, these are the same in the cloud as locally.
  //   return cloudApiBase._setupRequest(
  //     'PUT',
  //     '/Messages/{id}/recipients/rel/' + recipientId,
  //     { background: background }
  //   );
  // },
  //
  // deleteMessage: function (localMessageId, background = true) {
  //   let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
  //   return cloudApiBase._setupRequest(
  //     'DELETE',
  //     '/Spheres/{id}/messages/' + cloudMessageId,
  //     { background: background }
  //   );
  // },
  //
  // deleteAllMessages: function (background = true) {
  //   return cloudApiBase._setupRequest(
  //     'DELETE',
  //     '/Spheres/{id}/deleteAllMessages',
  //     { background: background }
  //   );
  // },
};
