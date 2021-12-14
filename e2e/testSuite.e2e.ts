import {BootApp} from "./tests/boot";
import {TestRegisterNewUser} from "./tests/register";
import {EnableTestOverrides} from "./tests/enableTestOverrides";

describe('Boot the app',                           BootApp);
describe('Set Custom Cloud Endpoints for Testing', EnableTestOverrides);
describe('Register a new user',                    TestRegisterNewUser);