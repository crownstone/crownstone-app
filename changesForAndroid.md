@react-native-community/slider updated

Added handles to most bridge methods.

Added nativeEvents:
"connectedToPeripheral"       // dataType: string --> handle of Crownstone  
"connectedToPeripheralFailed" // dataType: string --> handle of Crownstone        
"disconnectedFromPeripheral"  // dataType: string --> handle of Crownstone       

Connect bridge method now returns the Crownstone's operation mode:
"unknown"
"setup"
"operation"
"dfu"

Add cancelConnectionRequest(handle) bridge method which will fail the connection promise with error "CONNECTION_CANCELLED". If this fails due to timeout, throw error "CANCEL_PENDING_CONNECTION_TIMEOUT". Other errors will be treated as bugs to solve (for now).

Move to the HERMES engine
https://reactnative.dev/docs/hermes

Presumably we'll be moving to RN 0.64.0

- add a getBehaviourMasterHashCRC where we get the CRC hash instead of the fletcher hash.
- This does not mean we will remove the other method.

- remove setMeshChannel bridge method. this is from the old mesh.

- Updated data type for this event:
    crownstoneAdvertisementReceived: "crownstoneAdvertisementReceived",   // data type = crownstoneAdvertisementSummary, this is only the handle. // Any advertisement, verified and unverified from crownstones.
    
Setup command will no longer receive meshAccessAddress. Hardcode into lib if required for legacy.

Turn on mesh command data changed. It is now a list of stone short ids.
turnOnMesh(handle: string, arrayOfStoneIds: number[])  

If a command fails due to not being connected to a crownstone (anymore), throw this error: "NOT_CONNECTED"

Added crash method to bridge

Updated sentry config (Contact Alex for details.)

install https://github.com/react-native-webrtc/react-native-webrtc