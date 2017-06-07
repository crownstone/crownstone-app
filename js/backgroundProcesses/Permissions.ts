
import {eventBus} from "../util/EventBus";
import {Util} from "../util/Util";
class PermissionClass {
  _store : any;
  _initialized : boolean = false;

  useKeepAliveState      = true; // g
  setBehaviourInCloud    = true; // a
  seeUpdateCrownstone    = true; // a?
  updateCrownstone       = true; // a
  setupCrownstone        = true; // a
  seeSetupCrownstone     = true; // a

  doLocalizationTutorial = true; // a?
  addRoom                = true; // a?
  editRoom               = true; // a
  removeRoom             = true; // a

  editCrownstone         = true; // a
  changeBehaviour        = true; // a
  removeCrownstone       = true; // a
  editAppliance          = true; // a
  removeAppliance        = true; // a

  editSphere             = true; // a
  manageUsers            = true; // a or m
  deleteSphere           = true; // a
  inviteAdminToSphere    = true; // a
  inviteMemberToSphere   = true; // a or m
  inviteGuestToSphere    = true; // a or m


  _loadStore(store) {
    if (this._initialized === false) {
      this._store = store;

      this._update();

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if  (change.setKeys || change.updateActiveSphere) {
          this._update();
        }
      });
    }
  }

  _update() {
    let state = this._store.getState();
    let activeSphere = state.app.activeSphere;
    let level = Util.data.getUserLevelInSphere(state, activeSphere);

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
        this.changeBehaviour        = true; // admin
        this.removeCrownstone       = true; // admin
        this.editAppliance          = true; // admin
        this.removeAppliance        = true; // admin

        this.editSphere             = true; // admin
        this.deleteSphere           = true; // admin
        this.inviteAdminToSphere    = true; // admin
      case 'member':
        this.useKeepAliveState      = true; // admin and member
        this.manageUsers            = true; // admin and member

        this.inviteMemberToSphere   = true; // admin and member
        this.inviteGuestToSphere    = true; // admin and member
      case 'guest':
        // nothing will be added.
    }
  }

  _revokeAll() {
    this.useKeepAliveState      = false; // g
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