import { LocationTransferNext }  from "../transferrers/LocationTransferNext";
import { ToonTransferNext }      from "../transferrers/ToonTransferNext";
import { StoneTransferNext }     from "../transferrers/StoneTransferNext";
import { SceneTransferNext }     from "../transferrers/SceneTransferNext";
import { HubTransferNext }       from "../transferrers/HubTransferNext";
import { BehaviourTransferNext } from "../transferrers/BehaviourTransferNext";
import { AbilityTransferNext }   from "../transferrers/AbilityTransferNext";
import { AbilityPropertyTransferNext } from "../transferrers/AbilityPropertyTransferNext";


export function mapLocalToCloud(item: any, type: SupportedMappingType) {
  switch (type) {
    case 'ability':
      return AbilityTransferNext.mapLocalToCloud(item as AbilityData);
    case 'abilityProperty':
      return AbilityPropertyTransferNext.mapLocalToCloud(item as AbilityPropertyData);
    case 'behaviour':
      return BehaviourTransferNext.mapLocalToCloud(item as BehaviourData);
    case 'hub':
      return HubTransferNext.mapLocalToCloud(item as HubData);
    case 'location':
      return LocationTransferNext.mapLocalToCloud(item as LocationData);
    case 'scene':
      return SceneTransferNext.mapLocalToCloud(item as SceneData);
    case 'sphereUser':
      return null;
    case 'stone':
      return StoneTransferNext.mapLocalToCloud(item as StoneData);
    case 'toon':
      return ToonTransferNext.mapLocalToCloud(item as ToonData);
    default:
      throw new Error("NOT_SUPPORTED");
  }
}

