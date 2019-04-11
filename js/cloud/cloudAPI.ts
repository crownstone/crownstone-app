'use strict';

import { activityLogs }      from './sections/activityLogs'
import { activityRanges }    from './sections/activityRanges'
import { appliances }        from './sections/appliances'
import { bootloader }        from './sections/bootloader'
import { cloudApiBase }      from './sections/cloudApiBase'
import { devices }           from './sections/devices'
import { firmware }          from './sections/firmware'
import { fingerprints }      from './sections/fingerprints'
import { installations }     from './sections/installations'
import { locations }         from './sections/locations'
import { messages }          from './sections/messages'
import { preferences }       from './sections/preferences'
import { stones }            from './sections/stones'
import { spheres }           from './sections/spheres'
import { schedules }         from './sections/schedules'
import { sync }              from './sections/sync/sync'
import { syncEvents }        from './sections/sync/syncEvents'
import { syncUsersInSphere } from './sections/sync/syncUsersInSphere'
import { user }              from './sections/user'

import { toon }              from './sections/thirdParty/toon'
import { xUtil } from "../util/StandAloneUtil";

function combineSections() {
  let result : any = {};
  xUtil.mixin(result, cloudApiBase, result);

  // mixin all modules.
  xUtil.mixin(result, activityLogs,      result);
  xUtil.mixin(result, activityRanges,    result);
  xUtil.mixin(result, appliances,        result);
  xUtil.mixin(result, bootloader,        result);
  xUtil.mixin(result, devices,           result);
  xUtil.mixin(result, firmware,          result);
  xUtil.mixin(result, fingerprints,      result);
  xUtil.mixin(result, installations,     result);
  xUtil.mixin(result, locations,         result);
  xUtil.mixin(result, messages,          result);
  xUtil.mixin(result, preferences,       result);
  xUtil.mixin(result, schedules,         result);
  xUtil.mixin(result, spheres,           result);
  xUtil.mixin(result, stones,            result);
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

