import {LOG} from "../logging/Log";
import { DataUtil } from "../util/DataUtil";
import { core } from "../core";

export class PermissionBase {
  canEditSphere           = false; // a or m

  useKeepAliveState       = false; // m
  setStoneTime            = false; // a or m
  setToonInCloud          = false; // a
  setBehaviourInCloud     = false; // a
  seeUpdateCrownstone     = false; // a?
  canUpdateCrownstone     = false; // a
  canSetupCrownstone      = false; // a
  seeSetupCrownstone      = false; // a
  moveCrownstone          = false; // a or m
  canLockCrownstone       = false; // a
  canUnlockCrownstone     = false; // a
  canEnableDimming        = false; // a

  canSetPositionInCloud   = false; // a

  doLocalizationTutorial  = false; // a?
  addRoom                 = false; // a?
  editRoom                = false; // a
  removeRoom              = false; // a

  editCrownstone          = false; // a
  changeBehaviour         = false; // a or m
  removeCrownstone        = false; // a
  canChangeAppliance      = false; // a or m
  editAppliance           = false; // a
  removeAppliance         = false; // a
  canClearErrors          = false; // a
  seeActivityLogs         = false; // a or m

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

  canCreateStones         = false; // a
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
}

const EmptyPermissions = new PermissionBase();


export class PermissionClass extends PermissionBase {
  _initialized : boolean = false;
  _sphereId : string;
  _enableUpdates : boolean = false;

  constructor(sphereId) {
    super();

    this._sphereId = sphereId;
    this.init();
  }

  init() {
    if (this._initialized === false) {
      this._initialized = true;

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      core.eventBus.on("databaseChange", (data) => {
        if (this._enableUpdates === false) {
          return;
        }

        let change = data.change;
        if (change.setKeys) {
          LOG.info("Permissions: Update permissions in " + this._sphereId + " due to keySet");
          this._update(core.store.getState());
        }
      });

      core.eventBus.on('userLoggedIn', () => {
        LOG.info("Permissions: Update permissions in Sphere " + this._sphereId + "  due to userLoggedIn");
        this._enableUpdates = true;
        this._update(core.store.getState());
      });

      // in case the login event has already fired before we init the permission module.
      this._enableUpdates = true;
      this._update(core.store.getState());
    }
  }

  pretendToBeAdmin() {
    console.warn("WARNING: OVERRIDING PERMISSIONS as ADMIN");
    this._update(null, 'admin')
  }

  pretendToBeMember() {
    console.warn("WARNING: OVERRIDING PERMISSIONS as MEMBER");
    this._update(null, 'member')
  }

  pretendToBeGuest() {
    console.warn("WARNING: OVERRIDING PERMISSIONS as GUEST");
    this._update(null, 'guest')
  }

  _update(state = null, levelOverride : any = false) {
    LOG.info("Permissions: Update permissions for", this._sphereId);
    let level = DataUtil.getUserLevelInSphere(state, this._sphereId);
    if (levelOverride) {
      level = levelOverride;
    }

    this._revokeAll();

    if (level === null) {
      return;
    }


    LOG.info("Permissions: Set all", this._sphereId, " for level:", level);
    switch (level) {
      case 'admin':
        this.setBehaviourInCloud     = true; // admin
        this.setToonInCloud          = true; // admin
        this.seeUpdateCrownstone     = true; // admin
        this.canUpdateCrownstone     = true; // admin
        this.canSetupCrownstone      = true; // admin
        this.seeSetupCrownstone      = true; // admin

        this.canSetPositionInCloud   = true; // admin

        this.addRoom                 = true; // admin
        this.editRoom                = true; // admin
        this.removeRoom              = true; // admin

        this.editCrownstone          = true; // admin
        this.removeCrownstone        = true; // admin
        this.editAppliance           = true; // admin
        this.removeAppliance         = true; // admin
        this.canClearErrors          = true; // admin

        this.editSphere              = true; // admin
        this.deleteSphere            = true; // admin
        this.inviteAdminToSphere     = true; // admin

        this.canClearAllSchedules    = true; // admin
        this.canLockCrownstone       = true; // admin
        this.canUnlockCrownstone     = true; // admin
        this.canEnableDimming        = true; // admin
      case 'member':
        this.doLocalizationTutorial  = true; // admin and member
        this.changeBehaviour         = true; // admin and member
        this.useKeepAliveState       = true; // admin and member
        this.setStoneTime            = true; // admin and member
        this.manageUsers             = true; // admin and member
        this.moveCrownstone          = true; // admin and member
        this.seeActivityLogs         = true; // admin and member

        this.inviteMemberToSphere    = true; // admin and member
        this.inviteGuestToSphere     = true; // admin and member

        this.canUploadStones         = true; // admin and member
        this.canUploadLocations      = true; // admin and member
        this.canUploadAppliances     = true; // admin and member
        this.canUploadData           = true; // admin and member
        this.canUploadSpheres        = true; // admin and member
        this.canUploadDiagnostics    = true; // admin and member

        this.canCreateStones         = true; // admin and member
        this.canCreateLocations      = true; // admin and member
        this.canCreateAppliances     = true; // admin and member
        this.canCreateData           = true; // admin and member
        this.canCreateSpheres        = true; // admin and member

        this.canAddSchedule          = true; // admin and member
        this.canEditSchedule         = true; // admin and member
        this.canSeeSchedules         = true; // admin and member
        this.canDeleteSchedule       = true; // admin and member

        this.canChangeAppliance      = true; // admin and member

        // spheres
        this.canEditSphere           = true; // admin and member
      case 'guest':
        // nothing will be added.
    }
  }

  _revokeAll() {
    LOG.info("Permissions: Revoking all", this._sphereId);
    let permissions = Object.keys(EmptyPermissions);
    for (let i = 0; i < permissions.length; i++) {
      this[permissions[i]] = false;
    }
  }
}

