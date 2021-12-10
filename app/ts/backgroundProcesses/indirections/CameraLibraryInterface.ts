import {Callback, CameraOptions, ImageLibraryOptions} from "react-native-image-picker/src/types";
import * as RNIP from "react-native-image-picker";

export function launchCamera(options: CameraOptions, callback: Callback) {
  if (CameraLibrarySettings.mockCameraLibrary) {
    mockCallback(callback);
  }
  else {
    RNIP.launchCamera(options, callback);
  }
}

export function launchImageLibrary(
  options: ImageLibraryOptions,
  callback: Callback,
) {
  if (CameraLibrarySettings.mockImageLibrary) {
    mockCallback(callback);
  }
  else {
    RNIP.launchImageLibrary(options, callback);
  }
}

function mockCallback(callback) {
  callback({
    didCancel: false,
    errorCode: null,
    assets:[{uri:require("../../../assets/images/mocks/testImage.png")}]
  });
}

export const CameraLibrarySettings = {
  mockImageLibrary:  false,
  mockCameraLibrary: false,
}