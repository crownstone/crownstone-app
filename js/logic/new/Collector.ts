/**
 * The Collector will determine which Crownstones will be contacted to attempt to perform a command. It will handle the
 * sourcing of nearby Crownstones, Crownstones in room, direct connection requests as well as attempt connections to
 * multiple Crownstones to deliver a message, after a few successful connections, the rest of the slots can be cancelled.
 */
import { SessionManager } from "./SessionManager";

/**
 * The collector is a util class that gathers handles you can request sessions for.
 */
export const Collector = {

  sendToMesh : function(meshId : string) {

  },

  sendToSphere : function(sphereId : string) {

  },

  sendToNearby : function() {

  },

  sendToLocation : function() {

  },

  // collect(options: CommandOptions) {
  //   this._requiredSuccesses = options.minConnections || 1;
  //   switch (options.type) {
  //     case "SINGLE":
  //       throw "USE_SINGULAR_COLLECTOR"
  //     case "NEARBY":
  //       this.requestNear(this._requiredSuccesses);
  //       break;
  //     case "LOCALIZATION":
  //       this.requestNear(this._requiredSuccesses);
  //       for (let locationId of options.target) {
  //         this.requestLocation(locationId, this._requiredSuccesses)
  //       }
  //       break;
  //     case "MESH":
  //       this.requestMesh(options.target[0], this._requiredSuccesses);
  //       break;
  //     case "SPHERE":
  //       this.requestSphere(options.target[0], this._requiredSuccesses);
  //       break;
  //   }
  // }
}