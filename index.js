import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  /Require cycle*/,
  /.*/,
])

import { USE_ERROR_REPORTING } from "./app/js/ExternalConfig";
import { BackgroundProcessHandler } from "./app/js/backgroundProcesses/BackgroundProcessHandler";
import Bugsnag from "@bugsnag/react-native";

console.log("...\n\n\n\n-------------------- APP STARTING UP --------------------\n\n\n\n...");

if (USE_ERROR_REPORTING) {
  Bugsnag.start();
}

BackgroundProcessHandler.start();

import {AppRegistry} from 'react-native';
import { App } from "./app/js/views/Routes";


AppRegistry.registerComponent('Crownstone', () => App);
