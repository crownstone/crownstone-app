import { LocationTransferNext }  from "../transferrers/LocationTransferNext";
import { ToonTransferNext }      from "../transferrers/ToonTransferNext";
import { StoneTransferNext }     from "../transferrers/StoneTransferNext";
import { SceneTransferNext }     from "../transferrers/SceneTransferNext";
import { HubTransferNext }       from "../transferrers/HubTransferNext";
import { BehaviourTransferNext } from "../transferrers/BehaviourTransferNext";
import { AbilityTransferNext }   from "../transferrers/AbilityTransferNext";
import { AbilityPropertyTransferNext } from "../transferrers/AbilityPropertyTransferNext";
import { FingerprintTransferNext }     from "../transferrers/FingerprintTransferNext";
import {MessageTransferNext} from "../transferrers/MessageTransferNext";
import {MessageReadTransferNext} from "../transferrers/MessageReadTransferNext";
import {MessageDeletedTransferNext} from "../transferrers/MessageDeletedTransferNext";


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
    case 'fingerprint':
      return FingerprintTransferNext.mapLocalToCloud(item as FingerprintData);
    case 'location':
      return LocationTransferNext.mapLocalToCloud(item as LocationData);
    case 'message':
      return MessageTransferNext.mapLocalToCloud(item as MessageData);
    case 'readBy':
      return MessageReadTransferNext.mapLocalToCloud(item as MessageStateData);
    case 'deletedBy':
      return MessageDeletedTransferNext.mapLocalToCloud(item as MessageStateData);
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

