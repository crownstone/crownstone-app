import {Callback, CameraOptions, ImageLibraryOptions} from "react-native-image-picker/src/types";
import * as RNIP from "react-native-image-picker";
import {Image} from 'react-native';

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
  let asset = Image.resolveAssetSource(require("../../../assets/images/mocks/testImage.png"));
  callback({
    didCancel: false,
    errorCode: null,
    assets:[asset]
  });
}

export const CameraLibrarySettings = {
  mockImageLibrary:  false,
  mockCameraLibrary: false,
}