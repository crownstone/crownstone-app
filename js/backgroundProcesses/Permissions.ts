import {eventBus} from "../util/EventBus";
import {Util} from "../util/Util";
import {LOG} from "../logging/Log";

export class PermissionBase {
  useKeepAliveState       = false; // g
  setStoneTime            = false; // a or m
  setBehaviourInCloud     = false; // a
  seeUpdateCrownstone     = false; // a?
  updateCrownstone        = false; // a
  setupCrownstone         = false; // a
  seeSetupCrownstone      = false; // a
  moveCrownstone          = false; // a or m

  doLocalizationTutorial  = false; // a?
  addRoom                 = false; // a?
  editRoom                = false; // a
  removeRoom              = false; // a

  editCrownstone          = false; // a
  changeBehaviour         = false; // a or m
  removeCrownstone        = false; // a
  editAppliance           = false; // a
  removeAppliance         = false; // a

  editSphere              = false; // a
  manageUsers             = false; // a or m
  deleteSphere            = false; // a
  inviteAdminToSphere     = false; // a
  inviteMemberToSphere    = false; // a or m
  inviteGuestToSphere     = false; // a or m

  canClearAllSchedules    = false; // a
  canAddSchedule          = false; // a or m
  canEditSchedule         = false; // a or m
  canSeeSchedules         = false; // a or m
  canDeleteSchedule       = false; // a or m

  canCreateStones         = false; // a or m
  canCreateLocations      = false; // a or m
  canCreateAppliances     = false; // a or m
  canCreateData           = false; // a or m
  canCreateSpheres        = false; // a or m

  canUploadDiagnostics    = false; // a or m
  canUploadStones         = false; // a or m
  canUploadLocations      = false; // a or m
  canUploadAppliances     = false; // a or m
  canUploadData           = false; // a or m
  canUploadSpheres        = false; // a or m
};

const EmptyPermissions = new PermissionBase();


export class PermissionClass extends PermissionBase {
  _store : any;
  _initialized : boolean = false;
  _sphereId : string;
  _enableUpdates : boolean = false;

  constructor(store, sphereId, userAlreadyLoggedIn) {
    super();

    this._sphereId = sphereId;
    this.loadStore(store, userAlreadyLoggedIn);
  }

  loadStore(store, userAlreadyLoggedIn) {
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("databaseChange", (data) => {
        if (this._enableUpdates === false) {
          return;
        }

        let change = data.change;
        if (change.setKeys) {
          LOG.info("Permissions: Update permissions in " + this._sphereId + " due to keySet");
          this._update(this._store.getState());
        }
      });

      eventBus.on('userLoggedIn', () => {
        LOG.info("Permissions: Update permissions in Sphere " + this._sphereId + "  due to userLoggedIn");
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

  _update(state = null) {
    LOG.info("Permissions: Update permissions for", this._sphereId);
    let level = Util.data.getUserLevelInSphere(state, this._sphereId);

    if (level === null) {
      return;
    }

    this._revokeAll();

    LOG.info("Permissions: Set all", this._sphereId, " for level:", level);
    switch (level) {
      case 'admin':
        this.setBehaviourInCloud     = true; // admin
        this.seeUpdateCrownstone     = true; // admin
        this.updateCrownstone        = true; // admin
        this.setupCrownstone         = true; // admin
        this.seeSetupCrownstone      = true; // admin

        this.addRoom                 = true; // admin
        this.editRoom                = true; // admin
        this.removeRoom              = true; // admin

        this.editCrownstone          = true; // admin
        this.removeCrownstone        = true; // admin
        this.editAppliance           = true; // admin
        this.removeAppliance         = true; // admin

        this.editSphere              = true; // admin
        this.deleteSphere            = true; // admin
        this.inviteAdminToSphere     = true; // admin

        this.canClearAllSchedules    = true; // admin
      case 'member':
        this.doLocalizationTutorial  = true; // admin and member
        this.changeBehaviour         = true; // admin and member
        this.useKeepAliveState       = true; // admin and member
        this.setStoneTime            = true; // admin and member
        this.manageUsers             = true; // admin and member
        this.moveCrownstone          = true; // admin and member

        this.inviteMemberToSphere    = true; // admin and member
        this.inviteGuestToSphere     = true; // admin and member

        this.canUploadStones         = true; // admin and member
        this.canUploadLocations      = true; // admin and member
        this.canUploadAppliances     = true; // admin and member
        this.canUploadData           = true; // admin and member
        this.canUploadSpheres        = true; // admin and member
        this.canUploadDiagnostics    = true; // admin and member

        this.canCreateStones         = true; // a or m
        this.canCreateLocations      = true; // a or m
        this.canCreateAppliances     = true; // a or m
        this.canCreateData           = true; // a or m
        this.canCreateSpheres        = true; // a or m

        this.canAddSchedule          = true; // a or m
        this.canEditSchedule         = true; // a or m
        this.canSeeSchedules         = true; // a or m
        this.canDeleteSchedule       = true; // a or m
      case 'guest':
        // nothing will be added.
    }
  }

  _revokeAll() {
    LOG.info("Permissions: Revoking all", this._sphereId);
    let permissions = Object.keys(EmptyPermissions);
    for (let i = 0; i < permissions.length; i++) {
      this[permissions[i]] = true;
    }
  }
}

