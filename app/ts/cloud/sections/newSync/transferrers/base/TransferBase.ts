import { core } from "../../../../../Core";

export function GenerateSphereTransferFunctions(transferUtil) {

  return {
    createLocal(localSphereId: string, data: Partial<any>) {
      let newItemData = transferUtil.getCreateLocalAction(localSphereId, data);
      core.store.dispatch(newItemData.action);
      return newItemData.id;
    }
  }
}

export function GenerateStoneTransferFunctions(transferUtil) {

  return {
    createLocal(localSphereId: string, localStoneId: string, data: Partial<any>) {
      let newItemData = transferUtil.getCreateLocalAction(localSphereId, localStoneId, data);
      core.store.dispatch(newItemData.action);
      return newItemData.id;
    }
  }
}


export function GenerateTransferFunctions(transferUtil) {

  return {
    createLocal(data: Partial<any>) {
      let newItemData = transferUtil.getCreateLocalAction(data);
      core.store.dispatch(newItemData.action);
      return newItemData.id;
    }
  }
}

