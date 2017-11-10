'use strict';
import { Alert } from 'react-native';

import { Util } from '../util/Util';
import { user } from './sections/user'
import { cloudApiBase } from './sections/cloudApiBase'
import { stones } from './sections/stones'
import { spheres } from './sections/spheres'
import { locations } from './sections/locations'
import { devices } from './sections/devices'
import { appliances } from './sections/appliances'
import { installations } from './sections/installations'
import { messages } from './sections/messages'
import { firmware } from './sections/firmware'
import { bootloader } from './sections/bootloader'
import { schedules } from './sections/schedules'
import { sync } from './sections/sync/sync'
import { syncEvents } from './sections/sync/syncEvents'
import { syncUsersInSphere } from './sections/sync/syncUsersInSphere'


function combineSections() {
  let result = {};
  Util.mixin(result, cloudApiBase);

  // mixin all modules.
  Util.mixin(result, appliances);
  Util.mixin(result, bootloader);
  Util.mixin(result, devices);
  Util.mixin(result, firmware);
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
  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

