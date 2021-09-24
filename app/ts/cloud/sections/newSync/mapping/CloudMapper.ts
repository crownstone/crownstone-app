import { HubSyncer }            from "../syncers/HubSyncerNext";
import { LocationSyncerNext }   from "../syncers/LocationSyncerNext";
import { SphereSyncerNext }     from "../syncers/SphereSyncerNext";
import { SceneSyncerNext }      from "../syncers/SceneSyncerNext";
import { SphereUserSyncerNext } from "../syncers/SphereUserSyncerNext";
import { BehaviourSyncerNext }  from "../syncers/BehaviourSyncerNext";
import { AbilitySyncerNext } from "../syncers/AbilitySyncerNext";
import { AbilityPropertySyncerNext } from "../syncers/AbilityPropertySyncerNext";


export function mapLocalToCloud(item: any, type: SupportedMappingType) {
  switch (type) {
    case 'location':
      return LocationSyncerNext.mapLocalToCloud(item as LocationData);
    case 'scene':
      return SceneSyncerNext.mapLocalToCloud(item as SceneData);
    case 'sphereUser':
      return SphereUserSyncerNext.mapLocalToCloud(item as SphereUserData);
    case 'hub':
      return HubSyncer.mapLocalToCloud(item as HubData);
    case 'behaviour':
      return BehaviourSyncerNext.mapLocalToCloud(item as BehaviourData);
    case 'ability':
      return AbilitySyncerNext.mapLocalToCloud(item as AbilityData);
    case 'abilityProperty':
      return AbilityPropertySyncerNext.mapLocalToCloud(item as AbilityPropertyData);
    default:
      throw new Error("NOT_SUPPORTED");
  }
}

