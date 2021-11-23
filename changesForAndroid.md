@react-native-community/slider updated

[v] Added handles to most bridge methods.

Added nativeEvents:
"connectedToPeripheral"       // dataType: string --> handle of Crownstone
"disconnectedFromPeripheral"  // dataType: string --> handle of Crownstone

Connect bridge method now returns the Crownstone's operation mode:
"unknown"
"setup"
"operation"
"dfu"
--> why?

[v] Add cancelConnectionRequest(handle) bridge method which will fail the connection promise with error "CONNECTION_CANCELLED". If this fails due to timeout, throw error "CANCEL_PENDING_CONNECTION_TIMEOUT". Other errors will be treated as bugs to solve (for now).

Move to the HERMES engine
https://reactnative.dev/docs/hermes

[v] Updated to RN 0.64.2

[v] remove setMeshChannel bridge method. this is from the old mesh.

- Updated data type for this event:
    crownstoneAdvertisementReceived: "crownstoneAdvertisementReceived",   // data type = crownstoneAdvertisementSummary, this is only the handle. // Any advertisement, verified and unverified from crownstones.
    
[v] Setup command will no longer receive meshAccessAddress. Hardcode into lib if required for legacy.

[v] Turn on mesh command data changed. It is now a list of stone short ids.
    turnOnMesh(handle: string, arrayOfStoneIds: number[])

If a command fails due to not being connected to a crownstone (anymore), throw this error: "NOT_CONNECTED"

[v] Added crash method to bridge

Updated sentry config (Contact Alex for details.)

install https://github.com/react-native-webrtc/react-native-webrtc

updated react-native-image-picker to v4.0.6
https://github.com/react-native-image-picker/react-native-image-picker/releases/tag/v4.0.6

Added setTimeViaBroadcast parameter enableTimeBasedNonce (boolean) to the end of the param list. False means use CAFEBABE instead of time as validation nonce.
This sets a customValidationNonce of 0xCAFEBABE

Add a tick event for the native bus. This event does not need data but should be approx. every second. The scheduler runs off this.
