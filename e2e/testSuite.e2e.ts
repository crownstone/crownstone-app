import {BootApp}                  from "./tests/initialization/boot";
import {EnableTestOverrides}      from "./tests/initialization/enableTestOverrides";
import {TestRegisterNewUser}      from "./tests/registerLogin/register";
import {LoginUser}                from "./tests/registerLogin/login";
import {PermissionInitialization} from "./tests/registerLogin/permissionInitialization";
import {SphereEditMenu}           from "./tests/sphereEditMenu";

import {Platform}                 from "./util/testUtil";
import {TestingAssistant}          from "./util/TestingAssistant";

export const CONFIG = {
  IP_ADDRESS:      process.env.IP_ADDRESS,
  ONLY_ESSENTIALS: false,
};

export const Assistant = new TestingAssistant();

if (CONFIG.IP_ADDRESS === undefined) { throw "IP_ADDRESS ENVIRONMENTAL VARIABLE IS REQUIRED."}

// check if the Platform variable has been provided.
console.log("Running tests on platform:", Platform());
console.log("Looking for cloud at IP:", CONFIG.IP_ADDRESS);

describe('Boot the app',                           BootApp);
describe('Set Custom Cloud Endpoints for Testing', EnableTestOverrides);
describe('Register a new user',                    TestRegisterNewUser);
describe('Login with user',                        LoginUser);
describe('Setup initial permissions',              PermissionInitialization);

describe('Test the Sphere Edit menu',              SphereEditMenu);

