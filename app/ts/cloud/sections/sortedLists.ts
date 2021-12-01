import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { cloudApiBase} from "./cloudApiBase";

export const sortedLists = {
  createSortedList: function(data : any, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/sortedLists/',
      {data:data, background: background},
      'body'
    );
  },

  updateSortedList: function(localSortedListId, data, background = true) {
    let cloudSortedListId = MapProvider.local2cloudMap.sortedLists[localSortedListId] || localSortedListId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'PUT',
      '/SortedList/' + cloudSortedListId,
      {background: background, data: data},
      'body'
    );
  },

  getSortedListsInSphere: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Spheres/{id}/sortedLists',
      {background: background}
    );
  },


  getSortedList: function(localSortedListId) {
    let cloudSortedListId = MapProvider.local2cloudMap.sortedLists[localSortedListId] || localSortedListId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'GET',
      '/SortedLists/' + cloudSortedListId
    );
  },


  deleteSortedList: function(localSortedListId) {
    let cloudSortedListId = MapProvider.local2cloudMap.sortedLists[localSortedListId] || localSortedListId; // the OR is in case a cloudId has been put into this method.
    if (cloudSortedListId) {
      return cloudApiBase._setupRequest(
        'DELETE',
        '/Spheres/{id}/sortedLists/' + cloudSortedListId
      );
    }
  },




};