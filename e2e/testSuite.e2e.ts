import {TestCustomCloudOverride} from "./tests/initializeCloudOverride";
import {BootApp} from "./tests/boot";
import {TestRegisterNewUser} from "./tests/register";

describe('Boot the app',                           BootApp);
describe('Set Custom Cloud Endpoints for Testing', TestCustomCloudOverride);
describe('Register a new user',                    TestRegisterNewUser);