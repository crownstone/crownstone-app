import {BootApp} from "./tests/boot";
import {TestRegisterNewUser} from "./tests/register";
import {EnableTestOverrides} from "./tests/enableTestOverrides";
import {Platform} from "./util/testUtil";

export const CONFIG = {IP_ADDRESS: process.env.IP_ADDRESS ?? '10.0.1.76'}

// check if the Platform variable has been provided.
console.log("Running tests on platform:",Platform());

describe('Boot the app',                           BootApp);
describe('Set Custom Cloud Endpoints for Testing', EnableTestOverrides);
describe('Register a new user',                    TestRegisterNewUser);