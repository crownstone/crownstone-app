'use strict';
import { Util } from '../util/Util';

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

function combineSections() {
  let result : any = {};
  Util.mixin(result, cloudApiBase, result);

  // mixin all modules.
  Util.mixin(result, activityLogs,      result);
  Util.mixin(result, activityRanges,    result);
  Util.mixin(result, appliances,        result);
  Util.mixin(result, bootloader,        result);
  Util.mixin(result, devices,           result);
  Util.mixin(result, firmware,          result);
  Util.mixin(result, fingerprints,      result);
  Util.mixin(result, installations,     result);
  Util.mixin(result, locations,         result);
  Util.mixin(result, messages,          result);
  Util.mixin(result, preferences,       result);
  Util.mixin(result, schedules,         result);
  Util.mixin(result, spheres,           result);
  Util.mixin(result, stones,            result);
  Util.mixin(result, sync,              result);
  Util.mixin(result, syncEvents,        result);
  Util.mixin(result, syncUsersInSphere, result);
  Util.mixin(result, user,              result);

  result["thirdParty"] = {toon:{}};
  Util.mixin(result.thirdParty.toon, toon, result);

  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

