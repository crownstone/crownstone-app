import { LOG, LOGd } from "../logging/Log";
import {PermissionBase, PermissionClass} from "./Permissions";
import { core } from "../core";

export class PermissionManagerClass {
  _initialized : boolean = false;
  _activeSphereId : string;

  permissionClasses = {};

  init() {
    if (this._initialized === false) {
      this._initialized = true;

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if (change.changeSpheres || change.changeSphereConfig || change.updateActiveSphere) {
          LOG.info("PermissionManager: Update permissions due to databaseChange");
          this._update(core.store.getState());
        }
      });

      core.eventBus.on('userLoggedIn', () => {
        LOG.info("PermissionManager: Update permissions due to userLoggedIn");
        this._update(core.store.getState());
      });

      // in case the login event has already fired before we init the permission module.
      this._update(core.store.getState());
    }
  }




  /**
   * This method will only create permission classes for each available Sphere and set the active Sphere
   * @param state
   * @private
   */
  _update(state) {
    LOGd.info("PermissionManager: Update permissionsManager");
    if (!state) { return; }
    this._activeSphereId = state.app.activeSphere;

    LOGd.info("PermissionManager: Update permissionsManager");
    // we don't clean up removed spheres since it does not really matter memory wise
    Object.keys(state.spheres).forEach((sphereId) => {
      if (this.permissionClasses[sphereId] === undefined) {
        LOG.info("PermissionManager: Creating PermissionClass for ", sphereId);
        this.permissionClasses[sphereId] = new PermissionClass(sphereId);
      }
    });
  }

  inSphere(sphereId : string) : PermissionBase {
    if (this.permissionClasses[sphereId]) {
      return this.permissionClasses[sphereId];
    }
    else {
      return new PermissionClass(sphereId);
    }
  }

  activeSphere() : PermissionBase {
    if (this._activeSphereId && this.permissionClasses[this._activeSphereId]) {
      return this.permissionClasses[this._activeSphereId]
    }
    else {
      // this returns a class with empty permissions. This means, nothing is allowed.
      return new PermissionBase();
    }
  }
}


export const Permissions = new PermissionManagerClass();