import {BootApp}                  from "./tests/initialization/boot";
import {EnableTestOverrides}      from "./tests/initialization/enableTestOverrides";
import {TestRegisterNewUser}      from "./tests/registerLogin/register";
import {LoginUser}                from "./tests/registerLogin/login";
import {PermissionInitialization} from "./tests/registerLogin/permissionInitialization";
import {SphereEditMenu}           from "./tests/sphereEdit/sphereEditMenu";

import {Platform}                 from "./util/TestUtil";
import {TestingAssistant}          from "./util/TestingAssistant";
import {SphereEditMenu_rooms} from "./tests/sphereEdit/sphereEditMenu_rooms";
import {SphereEditMenu_users} from "./tests/sphereEdit/sphereEditMenu_users";
import {SphereEditMenu_crownstones_empty} from "./tests/sphereEdit/sphereEditMenu_crownstones_empty";
import {SphereEditMenu_integrations} from "./tests/sphereEdit/sphereEditMenu_integrations";
import {SphereEditMenu_sphereSettings} from "./tests/sphereEdit/sphereEditMenu_sphereSettings";
import {SphereEditMenu_sphereManagement} from "./tests/sphereEdit/SphereEditMenu_sphereManagement";
import {SphereEditMenu_close} from "./tests/sphereEdit/sphereEditMenu_close";

export const CONFIG = {
  IP_ADDRESS:      process.env.IP_ADDRESS,
  ONLY_ESSENTIALS: false,
};

export const Assistant = new TestingAssistant();

if (CONFIG.IP_ADDRESS === undefined) { throw "IP_ADDRESS ENVIRONMENTAL VARIABLE IS REQUIRED."}

// check if the Platform variable has been provided.
console.log("Running tests on platform:", Platform());
console.log("Looking for cloud at IP:", CONFIG.IP_ADDRESS);

describe('Boot the app',                               BootApp);
describe('Set UI test overrides',                      EnableTestOverrides);
describe('Register a new user',                        TestRegisterNewUser);
describe('Login with user',                            LoginUser);
describe('Setup initial permissions',                  PermissionInitialization);
//
describe('Test the Sphere Edit menu',                  SphereEditMenu);
describe('Test the Sphere Edit menu, sphere creation', SphereEditMenu_sphereManagement);
describe('Test the Sphere Edit menu, rooms',           SphereEditMenu_rooms);
describe('Test the Sphere Edit menu, no crownstones',  SphereEditMenu_crownstones_empty);
describe('Test the Sphere Edit menu, users',           SphereEditMenu_users);
describe('Test the Sphere Edit menu, integrations',    SphereEditMenu_integrations);
describe('Test the Sphere Edit menu, sphere settings', SphereEditMenu_sphereSettings);
describe('Test the Sphere Edit menu, close',           SphereEditMenu_close);

