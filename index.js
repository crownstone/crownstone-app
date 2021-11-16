import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Module RCTImageLoader requires',
  'Module ToastManager',
  'Require cycles*',
  'Warning: componentWillUpdate is deprecated',
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Module RNWebGLTextureLoader requires main queue setup',
  // RN 0.58.6 ships with RNCameraRoll with this issue: https://github.com/facebook/react-native/issues/23755:
  'Module RCTImagePickerManager requires main queue setup since it overrides `init`',
])

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

