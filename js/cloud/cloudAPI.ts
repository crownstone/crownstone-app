'use strict';
import { Alert } from 'react-native';

import { mixin } from '../util/Util';

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
  mixin(result, base);
  mixin(result, user);
  mixin(result, stones);
  mixin(result, locations);
  mixin(result, spheres);
  mixin(result, devices);
  mixin(result, appliances);
  mixin(result, sync);
  return result;
}

/**
 * This adds all sections into the CLOUD
 */
export const CLOUD : any = combineSections();

