import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  /Require cycle*/,
  /.*/,
])
Error.stackTraceLimit = 30;

console.log("...-------------------- APP INITIALIZING --------------------...");

import { USE_ERROR_REPORTING } from "./app/js/ExternalConfig";
import { loadRoutes } from "./app/js/views/Routes";
import { BackgroundProcessHandler } from "./app/js/backgroundProcesses/BackgroundProcessHandler";
import Bugsnag from "@bugsnag/react-native";

import 'react-native-console-time-polyfill';

console.log("...\n\n\n\n-------------------- APP STARTING UP --------------------\n\n\n\n...");

if (USE_ERROR_REPORTING) {
  Bugsnag.start();
}

loadRoutes();
BackgroundProcessHandler.start();

