import {eventBus} from "../util/EventBus";
import {LOG} from "../logging/Log";
import {PermissionBase, PermissionClass} from "./Permissions";

export class PermissionManagerClass {
  _store : any;
  _initialized : boolean = false;
  _activeSphereId : string;
  _userAlreadyLoggedIn : boolean = false;
  _enableUpdates : boolean = false;

  permissionClasses = {};

  loadStore(store, userAlreadyLoggedIn : boolean) {
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;
      this._userAlreadyLoggedIn = userAlreadyLoggedIn;

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("databaseChange", (data) => {
        if (this._enableUpdates === false) {
          return;
        }

        let change = data.change;
        if (change.changeSpheres || change.changeSphereConfig || change.updateActiveSphere) {
          LOG.info("PermissionManager: Update permissions due to databaseChange");
          this._update(this._store.getState());
        }
      });

      eventBus.on('userLoggedIn', () => {
        LOG.info("PermissionManager: Update permissions due to userLoggedIn");
        this._enableUpdates = true;
        this._userAlreadyLoggedIn = true;
        this._update(this._store.getState());
      });

      // in case the login event has already fired before we init the permission module.
      if (userAlreadyLoggedIn === true) {
        this._enableUpdates = true;
        this._update(this._store.getState());
      }
    }
  }


  /**
   * This method will only create permission classes for each available Sphere and set the active Sphere
   * @param state
   * @private
   */
  _update(state) {
    if (!state) { return; }

    this._activeSphereId = state.app.activeSphere;

    // we don't clean up removed spheres since it does not really matter memory wise
    Object.keys(state.spheres).forEach((sphereId) => {
      if (this.permissionClasses[sphereId] === undefined) {
        LOG.info("PermissionManager: Creating PermissionClass for ", sphereId);
        this.permissionClasses[sphereId] = new PermissionClass(this._store, sphereId, this._userAlreadyLoggedIn);
      }
    });
  }

  inSphere(sphereId) : PermissionBase {
    if (this.permissionClasses[sphereId]) {
      return this.permissionClasses[sphereId];
    }
    else {
      // this returns a class with empty permissions. This means, nothing is allowed.
      return new PermissionBase();
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