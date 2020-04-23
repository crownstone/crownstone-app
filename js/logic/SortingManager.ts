import { core } from "../core";
import { xUtil } from "../util/StandAloneUtil";


export class SortingManager {

  static getFromId(sphereId, sortedListId) : SortedListData | null {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    return sphere.sortedLists[sortedListId] || null;
  }

  /**
   * @param sphereId
   * @param viewKey         | this is a string like "RoomOverview" or "Scenes" that identifies which view it belongs to
   * @param referenceId     | this is the Id of a location that corresponds to the RoomOverview.
   * @param sortedListOfIds | Optionally, provide an initial list.
   */
  static getList(sphereId : string, viewKey: string, referenceId: string, listOfIds?: string[]) : SortedList {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];

    let sortedListId = viewKey + "_" + referenceId;
    let listElement : SortedListData = sphere.sortedLists[sortedListId];
    if (listElement === undefined) {
      core.store.dispatch({
        type:"ADD_SORTED_LIST",
        sphereId:     sphereId,
        sortedListId: sortedListId,
        data: {
          referenceId: referenceId,
          viewKey:     viewKey,
          sortedList:  listOfIds || [],
        }
      });
      return new SortedList(sphereId, sortedListId, listOfIds || []);
    }
    else {
      let initialList = new SortedList(sphereId, sortedListId, listElement.sortedList);
      if (xUtil.arrayCompare(listElement.sortedList, listOfIds) === false) {
        initialList.mustContain(listOfIds)
      }
      return initialList;
    }
  }

  static removeFromLists(itemId) : void {
    let state = core.store.getState();
    let spheres = state.spheres;
    let actions = [];
    Object.keys(spheres).forEach((sphereId) => {
      let sortedLists = spheres[sphereId].sortedLists;
      Object.keys(sortedLists).forEach((sortedListId) => {
        let data = sortedLists[sortedListId];
        let listPosition = data.sortedList.indexOf(itemId);
        if (listPosition !== -1) {
          if (data.sortedList.length === 1) {
            actions.push({
              type:"REMOVE_SORTED_LIST",
              sphereId: sphereId,
              sortedListId: sortedListId
            })
          }
          else {
            let newList = [...data.sortedList];
            newList.splice(listPosition,1);
            actions.push(actions.push({
              type:"UPDATE_SORTED_LIST",
              sphereId: sphereId,
              sortedListId: sortedListId,
              data: { sortedList: newList }
            }));
          }
        }
      });
    });

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  }

  /**
   * In case a referenceId get's removed (like a location, which could have had a RoomOverview sortedlist)
   * this method will remove any lists that were affected.
   * @param referenceId
   */
  static removeByReferenceId(referenceId) : void {
    let state = core.store.getState();
    let spheres = state.spheres;
    let actions = [];
    Object.keys(spheres).forEach((sphereId) => {
      let sortedLists = spheres[sphereId].sortedLists;
      Object.keys(sortedLists).forEach((sortedListId) => {
        let data = sortedLists[sortedListId];
        if (data.referenceId === referenceId) {
          actions.push({
            type:"REMOVE_SORTED_LIST",
            sphereId: sphereId,
            sortedListId: sortedListId
          })
        }
      });
    });

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  }

  /**
   * If we get a sortedList from the cloud, we need to map it to a local sorted list
   * @param sortedList
   */
  static mapCloudToLocal(sortedList: {cloudId: string, data: string[], referenceId: string, [ key:string ]: any }) {

  }

  /**
   * If we get a sortedList from the cloud, we need to map it to a local sorted list
   * @param sortedList
   */
  static mapLocalToCloud(sortedList : SortedListData) {

  }

}

export class SortedList {

  sphereId     : string
  sortedListId : string
  sortedList   : string[] = [];

  constructor(sphereId : string, sortedListId: string, sortedList: string[]) {
    this.sphereId     = sphereId;
    this.sortedListId = sortedListId;
    this.sortedList = sortedList;
  }

  mustContain(requiredItems: string[]) {
    let changeRequired = false;
    let existingItemMap = {}
    for (let i = 0; i < this.sortedList.length; i++) {
      existingItemMap[this.sortedList[i]] = true;
    }
    let requiredItemsMap = {}
    for (let i = 0; i < requiredItems.length; i++) {
      requiredItemsMap[requiredItems[i]] = true;
    }

    // add new required items to bottle of the list.
    for (let i = 0; i < requiredItems.length; i++) {
      if (!existingItemMap[requiredItems[i]]) {
        this.sortedList.push(requiredItems[i]);
        changeRequired = true;
      }
    }

    // remove other items that should not be in there.
    for (let i = this.sortedList.length; i >= 0; i--) {
      if (!requiredItemsMap[this.sortedList[i]]) {
        this.sortedList.splice(i,1);
        changeRequired = true;
      }
    }

    if (changeRequired) {
      core.store.dispatch({
        type:"UPDATE_SORTED_LIST",
        sphereId:     this.sphereId,
        sortedListId: this.sortedListId,
        data: {
          sortedList: this.sortedList
        }
      });
    }
  }

  update(items : string[]) {
    // dont persist if there is no change.
    if (xUtil.arrayCompare(items, this.sortedList) === true) {
      return;
    }

    this.sortedList = items;
    core.store.dispatch({
      type:"UPDATE_SORTED_LIST",
      sphereId:     this.sphereId,
      sortedListId: this.sortedListId,
      data: {
        sortedList: this.sortedList
      }
    });
  }

}