'use strict';

import { bootloader }        from './sections/bootloader'
import { cloudApiBase, TokenStore } from "./sections/cloudApiBase";
import { devices }           from './sections/devices'
import { firmware }          from './sections/firmware'
import { fingerprints }      from './sections/fingerprints'
import { installations }     from './sections/installations'
import { locations }         from './sections/locations'
import { messages }          from './sections/messages'
import { preferences }       from './sections/preferences'
import { stones }            from './sections/stones'
import { scenes }            from './sections/scenes'
import { stonesAbilities }   from './sections/stonesAbilities'
import { stonesBehaviours }  from './sections/stonesBehaviours'
import { spheres }           from './sections/spheres'
import { sync }              from './sections/sync/sync'
import { syncEvents }        from './sections/sync/syncEvents'
import { syncUsersInSphere } from './sections/sync/syncUsersInSphere'
import { user }              from './sections/user'

import { toon }              from './sections/thirdParty/toon'
import { xUtil }             from "../util/StandAloneUtil";
import { MapProvider }       from "../backgroundProcesses/MapProvider";

function combineSections() {
  let result : any = {};
  xUtil.mixin(result, cloudApiBase, result);

  // mixin all modules.
  xUtil.mixin(result, bootloader,        result);
  xUtil.mixin(result, devices,           result);
  xUtil.mixin(result, firmware,          result);
  xUtil.mixin(result, fingerprints,      result);
  xUtil.mixin(result, installations,     result);
  xUtil.mixin(result, locations,         result);
  xUtil.mixin(result, messages,          result);
  xUtil.mixin(result, preferences,       result);
  xUtil.mixin(result, spheres,           result);
  xUtil.mixin(result, scenes,            result);
  xUtil.mixin(result, stones,            result);
  xUtil.mixin(result, stonesAbilities,   result);
  xUtil.mixin(result, stonesBehaviours,  result);
  xUtil.mixin(result, sync,              result);
  xUtil.mixin(result, syncEvents,        result);
  xUtil.mixin(result, syncUsersInSphere, result);
  xUtil.mixin(result, user,              result);

  result["thirdParty"] = {toon:{}};
  xUtil.mixin(result.thirdParty.toon, toon, result);

  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

CLOUD.setAccess =          function(accessToken)      : any { TokenStore.accessToken  = accessToken;      return CLOUD; };
CLOUD.setUserId =          function(userId)           : any { TokenStore.userId       = userId;           return CLOUD; }; // cloudId === localId
CLOUD.forUser =            function(userId)           : any { TokenStore.userId       = userId;           return CLOUD; }; // cloudId === localId
CLOUD.forDevice =          function(deviceId)         : any { TokenStore.deviceId     = deviceId;         return CLOUD; }; // cloudId === localId
CLOUD.forInstallation =    function(installationId)   : any { TokenStore.installationId = installationId; return CLOUD; }; // cloudId === localId
CLOUD.forStone =           function(localStoneId)     : any { TokenStore.stoneId      = MapProvider.local2cloudMap.stones[localStoneId]           || localStoneId;      return CLOUD; };
CLOUD.forSphere =          function(localSphereId)    : any { TokenStore.sphereId     = MapProvider.local2cloudMap.spheres[localSphereId]         || localSphereId;     return CLOUD; };
CLOUD.forScene =           function(localSceneId)     : any { TokenStore.sceneId      = MapProvider.local2cloudMap.scenes[localSceneId]           || localSceneId;      return CLOUD; };
CLOUD.forSortedList =      function(localSortedListId): any { TokenStore.sortedListId = MapProvider.local2cloudMap.sortedLists[localSortedListId] || localSortedListId; return CLOUD; };
CLOUD.forLocation =        function(localLocationId)  : any { TokenStore.locationId   = MapProvider.local2cloudMap.locations[localLocationId]     || localLocationId;   return CLOUD; };
CLOUD.forMessage =         function(localMessageId)   : any { TokenStore.messageId    = MapProvider.local2cloudMap.messages[localMessageId]       || localMessageId;    return CLOUD; };
CLOUD.forToon =            function(localToonId)      : any { TokenStore.toonId       = MapProvider.local2cloudMap.toons[localToonId]             || localToonId;       return CLOUD; };
