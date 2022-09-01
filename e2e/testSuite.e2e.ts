import { BootApp }                          from "./tests/initialization/boot";

import { Platform }                         from "./util/TestUtil";
import { TestingAssistant }                 from "./util/TestingAssistant";
import { SphereEditMenu_start }             from "./tests/sphereEdit/sphereEditMenu_start";
import { SphereEditMenu_rooms }             from "./tests/sphereEdit/sphereEditMenu_rooms";
import { SphereEditMenu_users }             from "./tests/sphereEdit/sphereEditMenu_users";
import { SphereEditMenu_crownstones_empty } from "./tests/sphereEdit/sphereEditMenu_crownstones_empty";
import { SphereEditMenu_integrations }      from "./tests/sphereEdit/sphereEditMenu_integrations";
import { SphereEditMenu_sphereSettings }    from "./tests/sphereEdit/sphereEditMenu_sphereSettings";
import { SphereEditMenu_sphereManagement }  from "./tests/sphereEdit/sphereEditMenu_sphereManagement";
import { SphereEditMenu_close }             from "./tests/sphereEdit/sphereEditMenu_close";

import { Rooms_edit }                       from "./tests/rooms/rooms_edit";
import { Rooms_deleteAll }                  from "./tests/rooms/rooms_deleteAll";
import { Rooms_createRoom }                 from "./tests/rooms/rooms_createRoom";

import { Settings_start }                   from "./tests/settings/settings_start";
import { Settings_myAccount }               from "./tests/settings/settings_myAccount";
import { Settings_privacy }                 from "./tests/settings/settings_privacy";
import { Settings_appSettings }             from "./tests/settings/settings_appSettings";
import { Settings_help }                    from "./tests/settings/settings_help";
import { Settings_logOut }                  from "./tests/settings/settings_logOut";
import { Settings_termsConditions }         from "./tests/settings/settings_termsConditions";
import { Initialization_buyCrownstones }    from "./tests/registerLogin/initialization_buyCrownstones";
import { Initialization_loginUser }         from "./tests/registerLogin/initialization_login";
import { Initialization_registerNewUser }   from "./tests/registerLogin/initialization_register";
import { Initialization_permissionInitialization } from "./tests/registerLogin/initialization_permissionInitialization";

import { SphereAdd_start }                  from "./tests/sphereAdd/sphereAdd_start";
import { SphereAdd_addCrownstoneMenu }      from "./tests/sphereAdd/sphereAdd_addCrownstoneMenu";
import { SphereAdd_addMenus }               from "./tests/sphereAdd/sphereAdd_addMenus";
import { SphereAdd_setup_crownstone }       from "./tests/sphereAdd/sphereAdd_setup_crownstone";
import { SphereAdd_close }                  from "./tests/sphereAdd/sphereAdd_close";
import { SideBar_usage } from "./tests/sidebar/sideBar_usage";

export const CONFIG = {
  IP_ADDRESS:      process.env.IP_ADDRESS,
  ONLY_ESSENTIALS: true,
  LINK_DELAY:      3000,
};

export const Assistant = new TestingAssistant();

if (CONFIG.IP_ADDRESS === undefined) { throw "IP_ADDRESS ENVIRONMENTAL VARIABLE IS REQUIRED."}

// check if the Platform variable has been provided.
console.log("Running tests on platform:", Platform());
console.log("Looking for cloud at IP:", CONFIG.IP_ADDRESS);

describe('Boot the app',                                 BootApp);

// reuse assumes the user is already logged in.
if (process.env.REUSE !== '1') {
  describe('Test the buy button',                        Initialization_buyCrownstones);
  describe('Register a new user',                        Initialization_registerNewUser);
  describe('Login with user',                            Initialization_loginUser);
  describe('Setup initial permissions',                  Initialization_permissionInitialization);
}

describe('Test if the sidebar works',                    SideBar_usage);
//
describe('Test room edit',                               Rooms_edit);
describe('Test room deletion',                           Rooms_deleteAll);
describe('Test room creation when there are no rooms',   Rooms_createRoom);
//
// describe('Test the Sphere Edit menu, start',             SphereEditMenu_start);
// describe('Test the Sphere Edit menu, sphere management', SphereEditMenu_sphereManagement);
// describe('Test the Sphere Edit menu, rooms',             SphereEditMenu_rooms);
// describe('Test the Sphere Edit menu, no crownstones',    SphereEditMenu_crownstones_empty);
// describe('Test the Sphere Edit menu, users',             SphereEditMenu_users);
// describe('Test the Sphere Edit menu, integrations',      SphereEditMenu_integrations);
// describe('Test the Sphere Edit menu, sphere settings',   SphereEditMenu_sphereSettings);
// describe('Test the Sphere Edit menu, close',             SphereEditMenu_close);
//
// describe('Test the Settings menu, start',                Settings_start);
// describe('Test the Settings menu, my account',           Settings_myAccount);
// describe('Test the Settings menu, privacy',              Settings_privacy);
// describe('Test the Settings menu, app settings',         Settings_appSettings);
// describe('Test the Settings menu, help',                 Settings_help);
// describe('Test the Settings menu, terms&conditions',     Settings_termsConditions);
// describe('Test the Settings menu, logout',               Settings_logOut);
//
// describe('SphereAdd, start',                             SphereAdd_start);
// describe('SphereAdd, add menus',                         SphereAdd_addMenus);
// describe('SphereAdd, add crownstone menu exploration',   SphereAdd_addCrownstoneMenu);
// describe('SphereAdd, add crownstone',                    SphereAdd_setup_crownstone);
// describe('SphereAdd, close',                             SphereAdd_close);
//
