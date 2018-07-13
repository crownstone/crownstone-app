'use strict';
import { Alert } from 'react-native';
import { Util } from '../util/Util';

import { appliances }        from './sections/appliances'
import { bootloader }        from './sections/bootloader'
import { cloudApiBase }      from './sections/cloudApiBase'
import { devices }           from './sections/devices'
import { firmware }          from './sections/firmware'
import { fingerprints }      from './sections/fingerprints'
import { installations }     from './sections/installations'
import { locations }         from './sections/locations'
import { messages }          from './sections/messages'
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
  Util.mixin(result, cloudApiBase);

  // mixin all modules.
  Util.mixin(result, appliances);
  Util.mixin(result, bootloader);
  Util.mixin(result, devices);
  Util.mixin(result, firmware);
  Util.mixin(result, fingerprints);
  Util.mixin(result, installations);
  Util.mixin(result, locations);
  Util.mixin(result, messages);
  Util.mixin(result, schedules);
  Util.mixin(result, spheres);
  Util.mixin(result, stones);
  Util.mixin(result, sync);
  Util.mixin(result, syncEvents);
  Util.mixin(result, syncUsersInSphere);
  Util.mixin(result, user);

  result["thirdParty"] = {toon:{}};
  Util.mixin(result.thirdParty.toon, toon);

  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

