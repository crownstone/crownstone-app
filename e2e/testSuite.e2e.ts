import {BootApp} from "./tests/boot";
import {TestRegisterNewUser} from "./tests/register";
import {EnableTestOverrides} from "./tests/enableTestOverrides";

export const CONFIG = {IP_ADDRESS: process.env.IP_ADDRESS ?? '10.0.1.76'}

describe('Boot the app',                           BootApp);
describe('Set Custom Cloud Endpoints for Testing', EnableTestOverrides);
describe('Register a new user',                    TestRegisterNewUser);