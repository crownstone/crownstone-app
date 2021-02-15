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

Add cancelConnectionRequest(handle) bridge method which will fail the connection promise with error "CONNECTION_CANCELLED". This will always succeed.

Move to the HERMES engine
https://reactnative.dev/docs/hermes

Presumably we'll be moving to RN 0.63.4

add a getBehaviourMasterHashCRC where we get the CRC hash instead of the fletcher hash.
This does not mean we will remove the other method.