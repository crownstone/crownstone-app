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