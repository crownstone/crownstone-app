
export const SyncUtil = {

  /**
   * This function will take the input reply object and create all fields (if required) in the tree structure
   * Finally, it can place the data provided in the child data field.
   * @param reply
   * @param treeArray
   * @param data
   */
  constructReply(reply: SyncRequestSphereData, treeArray: string[], data?) {
    let tree : any = reply;
    let lastTree : any;
    for (let item of treeArray) {
      if (tree[item] === undefined) {
        tree[item] = {};
      }
      lastTree = tree;
      tree = tree[item];
    }

    if (data) {
      lastTree[treeArray[treeArray.length - 1]].data = data;
    }
  },

}