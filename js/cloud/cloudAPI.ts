'use strict';
import { Alert } from 'react-native';

import { Util } from '../util/Util';
import { user } from './sections/user'
import { base } from './sections/base'
import { stones } from './sections/stones'
import { spheres } from './sections/spheres'
import { locations } from './sections/locations'
import { devices } from './sections/devices'
import { appliances } from './sections/appliances'
import { sync } from './sections/sync'


function combineSections() {
  let result = {};
  Util.mixin(result, base);
  Util.mixin(result, user);
  Util.mixin(result, stones);
  Util.mixin(result, locations);
  Util.mixin(result, spheres);
  Util.mixin(result, devices);
  Util.mixin(result, appliances);
  Util.mixin(result, sync);
  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

