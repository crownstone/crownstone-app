
import {eventBus} from "../util/EventBus";
import {Util} from "../util/Util";
export class PermissionClass {
  _store : any;
  _initialized : boolean = false;
  _enableUpdates : boolean = false;

  useKeepAliveState      = false; // g
  setStoneTime           = false; // a or m
  setBehaviourInCloud    = false; // a
  seeUpdateCrownstone    = false; // a?
  updateCrownstone       = false; // a
  setupCrownstone        = false; // a
  seeSetupCrownstone     = false; // a

  doLocalizationTutorial = false; // a?
  addRoom                = false; // a?
  editRoom               = false; // a
  removeRoom             = false; // a

  editCrownstone         = false; // a
  changeBehaviour        = false; // a or m
  removeCrownstone       = false; // a
  editAppliance          = false; // a
  removeAppliance        = false; // a

  editSphere             = false; // a
  manageUsers            = false; // a or m
  deleteSphere           = false; // a
  inviteAdminToSphere    = false; // a
  inviteMemberToSphere   = false; // a or m
  inviteGuestToSphere    = false; // a or m




  _loadStore(store, userAlreadyLoggedIn) {
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("databaseChange", (data) => {
        if (this._enableUpdates === false) {
          return;
        }

        let change = data.change;
        if (change.setKeys || change.updateActiveSphere) {
          this._update(this._store.getState());
        }
      });

      eventBus.on('userLoggedIn', () => {
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

  _update(state = null, customSphereId = null) {
    let activeSphere = customSphereId || state.app.activeSphere;
    let level = Util.data.getUserLevelInSphere(state, activeSphere);

    if (level === null) {
      return;
    }

    this._revokeAll();

    switch (level) {
      case 'admin':
        this.setBehaviourInCloud    = true; // admin
        this.seeUpdateCrownstone    = true; // admin
        this.updateCrownstone       = true; // admin
        this.setupCrownstone        = true; // admin
        this.seeSetupCrownstone     = true; // admin

        this.doLocalizationTutorial = true; // admin
        this.addRoom                = true; // admin
        this.editRoom               = true; // admin
        this.removeRoom             = true; // admin

        this.editCrownstone         = true; // admin
        this.removeCrownstone       = true; // admin
        this.editAppliance          = true; // admin
        this.removeAppliance        = true; // admin

        this.editSphere             = true; // admin
        this.deleteSphere           = true; // admin
        this.inviteAdminToSphere    = true; // admin
      case 'member':
        this.changeBehaviour        = true; // admin and member
        this.useKeepAliveState      = true; // admin and member
        this.setStoneTime           = true; // admin and member
        this.manageUsers            = true; // admin and member

        this.inviteMemberToSphere   = true; // admin and member
        this.inviteGuestToSphere    = true; // admin and member
      case 'guest':
        // nothing will be added.
    }
  }

  _revokeAll() {
    this.useKeepAliveState      = false; // g
    this.setStoneTime           = false; // g
    this.setBehaviourInCloud    = false; // a
    this.seeUpdateCrownstone    = false; // a?
    this.updateCrownstone       = false; // a
    this.setupCrownstone        = false; // a
    this.seeSetupCrownstone     = false; // a

    this.doLocalizationTutorial = false; // a?
    this.addRoom                = false; // a?
    this.editRoom               = false; // a
    this.removeRoom             = false; // a

    this.editCrownstone         = false; // a
    this.changeBehaviour        = false; // a
    this.removeCrownstone       = false; // a
    this.editAppliance          = false; // a
    this.removeAppliance        = false; // a

    this.editSphere             = false; // a
    this.manageUsers            = false; // a or m
    this.deleteSphere           = false; // a
    this.inviteAdminToSphere    = false; // a
    this.inviteMemberToSphere   = false; // a or m
    this.inviteGuestToSphere    = false; // a or m

  }
}


export const Permissions = new PermissionClass();