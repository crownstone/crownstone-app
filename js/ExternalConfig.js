var DeviceInfo = require('react-native-device-info');

console.log("Dev", DeviceInfo);  // e.g. FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9
console.log("Device Unique ID", DeviceInfo.getUniqueID());  // e.g. FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9
// * note this is IDFV on iOS so it will change if all apps from the current apps vendor have been previously uninstalled
console.log("Device Manufacturer", DeviceInfo.getManufacturer());  // e.g. Apple
console.log("Device Brand", DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
console.log("Device Model", DeviceInfo.getModel());  // e.g. iPhone 6
console.log("Device ID", DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
console.log("System Name", DeviceInfo.getSystemName());  // e.g. iPhone OS
console.log("System Version", DeviceInfo.getSystemVersion());  // e.g. 9.0
console.log("Bundle ID", DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
console.log("Build Number", DeviceInfo.getBuildNumber());  // e.g. 89
console.log("App Version", DeviceInfo.getVersion());  // e.g. 1.1.0
console.log("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
console.log("Device Name", DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
console.log("User Agent", DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
console.log("Device Locale", DeviceInfo.getDeviceLocale()); // e.g en-US
console.log("Device Country", DeviceInfo.getDeviceCountry()); // e.g US
console.log("App Instance ID", DeviceInfo.getInstanceID()); // ANDROID ONLY - see https://developers.google.com/instance-id/

export const CLOUD_ADDRESS = 'http://crownstone-cloud.herokuapp.com/api/';
export const CROWNSTONE_SERVICEDATA_UUID = 'C001';
export const DEBUG = true;
export const DISABLE_NATIVE = DeviceInfo.getModel() === "Simulator"; // this will disable the native calls.
export const SILENCE_CLOUD = false; // this will silently cancel all calls to the cloud.
export const OVERRIDE_DATABASE = true;

export let NO_LOCATION_NAME = 'None'; // this is a let because localization may change it.