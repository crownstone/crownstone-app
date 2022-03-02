import {BootApp}                  from "./tests/initialization/boot";
import {EnableTestOverrides}      from "./tests/initialization/enableTestOverrides";
import {TestRegisterNewUser}      from "./tests/registerLogin/register";
import {LoginUser}                from "./tests/registerLogin/login";
import {PermissionInitialization} from "./tests/registerLogin/permissionInitialization";

import {Platform}                 from "./util/TestUtil";
import {TestingAssistant}         from "./util/TestingAssistant";
import {SphereEditMenu_start}     from "./tests/sphereEdit/sphereEditMenu_start";
import {SphereEditMenu_rooms}     from "./tests/sphereEdit/sphereEditMenu_rooms";
import {SphereEditMenu_users}     from "./tests/sphereEdit/sphereEditMenu_users";
import {SphereEditMenu_crownstones_empty} from "./tests/sphereEdit/sphereEditMenu_crownstones_empty";
import {SphereEditMenu_integrations}      from "./tests/sphereEdit/sphereEditMenu_integrations";
import {SphereEditMenu_sphereSettings}    from "./tests/sphereEdit/sphereEditMenu_sphereSettings";
import {SphereEditMenu_sphereManagement}  from "./tests/sphereEdit/sphereEditMenu_sphereManagement";
import {SphereEditMenu_close}     from "./tests/sphereEdit/sphereEditMenu_close";

import {Rooms_edit}               from "./tests/rooms/rooms_edit";
import {Rooms_deleteAll}          from "./tests/rooms/rooms_deleteAll";
import {Rooms_createRoom}         from "./tests/rooms/rooms_createRoom";

import {Settings_start}           from "./tests/settings/settings_start";
import {Settings_myAccount} from "./tests/settings/settings_myAccount";
import {Settings_privacy} from "./tests/settings/settings_privacy";
import { Settings_appSettings } from "./tests/settings/settings_appSettings";

export const CONFIG = {
  IP_ADDRESS:      process.env.IP_ADDRESS,
  ONLY_ESSENTIALS: true,
};

export const Assistant = new TestingAssistant();

if (CONFIG.IP_ADDRESS === undefined) { throw "IP_ADDRESS ENVIRONMENTAL VARIABLE IS REQUIRED."}

// check if the Platform variable has been provided.
console.log("Running tests on platform:", Platform());
console.log("Looking for cloud at IP:", CONFIG.IP_ADDRESS);

describe('Boot the app',                                 BootApp);
// describe('Set UI test overrides',                        EnableTestOverrides);
// describe('Register a new user',                          TestRegisterNewUser);
// describe('Login with user',                              LoginUser);
// describe('Setup initial permissions',                    PermissionInitialization);
// //
// describe('Test room edit',                               Rooms_edit);
// describe('Test room deletion',                           Rooms_deleteAll);
// describe('Test room creation when there are no rooms',   Rooms_createRoom);

// describe('Test the Sphere Edit menu, start',             SphereEditMenu_start);
// describe('Test the Sphere Edit menu, sphere management', SphereEditMenu_sphereManagement);
// describe('Test the Sphere Edit menu, rooms',             SphereEditMenu_rooms);
// describe('Test the Sphere Edit menu, no crownstones',    SphereEditMenu_crownstones_empty);
// describe('Test the Sphere Edit menu, users',             SphereEditMenu_users);
// describe('Test the Sphere Edit menu, integrations',      SphereEditMenu_integrations);
// describe('Test the Sphere Edit menu, sphere settings',   SphereEditMenu_sphereSettings);
// describe('Test the Sphere Edit menu, close',             SphereEditMenu_close);

describe('Test the Settings menu, start',             Settings_start);
describe('Test the Settings menu, my account',        Settings_myAccount);
describe('Test the Settings menu, privacy',           Settings_privacy);
describe('Test the Settings menu, app settings',      Settings_appSettings);
