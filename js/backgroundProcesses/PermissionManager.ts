import {eventBus} from "../util/EventBus";
import {LOG} from "../logging/Log";
import {PermissionBase, PermissionClass} from "./Permissions";

export class PermissionManagerClass {
  _store : any;
  _initialized : boolean = false;
  _activeSphereId : string;
  _userAlreadyLoggedIn : string;
  _enableUpdates : boolean = false;

  permissionClasses = {};

  _loadStore(store, userAlreadyLoggedIn) {
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
          LOG.info("Permissions: Update permissions due to databaseChange");
          this._update(this._store.getState());
        }
      });

      eventBus.on('userLoggedIn', () => {
        LOG.info("Permissions: Update permissions due to userLoggedIn");
        this._enableUpdates = true;
        this._update(this._store.getState());
      });

      // in case the login event has already fired before we init the permission module.
      if (userAlreadyLoggedIn === true) {
        this._enableUpdates = true;
        this._update(this._store.getState());
      }
    }
  }

  _update(state) {
    if (!state) {
      return;
    }

    this._activeSphereId = state.app.activeSphere;

    let spheres = state.spheres;
    let sphereIds = Object.keys(spheres);


    // we don't clean up removed spheres since it does not really matter memory wise
    sphereIds.forEach((sphereId) => {
      if (this.permissionClasses[sphereId] === undefined) {
        this.permissionClasses[sphereId] = new PermissionClass(this._store, sphereId, this._userAlreadyLoggedIn);
      }
    });
  }

  inSphere(sphereId) : PermissionBase {
    if (this.permissionClasses[sphereId]) {
      return this.permissionClasses[sphereId];
    }
    else {
      // this returns a class with empty permissions.
      return new PermissionBase();
    }
  }

  activeSphere() : PermissionBase {
    if (this._activeSphereId && this.permissionClasses[this._activeSphereId]) {
      return this.permissionClasses[this._activeSphereId]
    }
    else {
      return new PermissionBase();
    }
  }


}


export const Permissions = new PermissionManagerClass();