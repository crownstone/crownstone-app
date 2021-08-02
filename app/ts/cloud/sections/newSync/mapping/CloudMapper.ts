import { HubSyncer } from "../syncers/HubSyncerNext";


export function mapLocalToCloud(sphereId:string, itemId: string, item: any, type: SupportedMappingType) {
  switch (type) {
    case 'hub':
      return HubSyncer.mapLocalToCloud(sphereId, itemId, item as HubData);
    default:
      throw new Error("NOT_SUPPORTED");
  }
}

