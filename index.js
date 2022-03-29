import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  /Require cycle*/,
  /.*/,
])

// Uncomment when you don't want the RN debug popups in app
//LogBox.ignoreAllLogs()

import { USE_ERROR_REPORTING } from "./app/js/ExternalConfig";
import { loadRoutes } from "./app/js/views/Routes";
import { BackgroundProcessHandler } from "./app/js/backgroundProcesses/BackgroundProcessHandler";
import Bugsnag from "@bugsnag/react-native";

console.log("...\n\n\n\n-------------------- APP STARTING UP --------------------\n\n\n\n...");

if (USE_ERROR_REPORTING) {
  Bugsnag.start();
}

loadRoutes();
BackgroundProcessHandler.start();

