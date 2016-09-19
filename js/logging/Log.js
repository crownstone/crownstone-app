import { DEBUG } from '../ExternalConfig'

export const LOG = function() {
  console.log.apply(this, arguments);
};

