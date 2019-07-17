# BluenetLib

This lib is used to interact with the Crownstone family of devices.
There are convenience methods that wrap the CoreBluetooth backend as well as
methods that simplify the services and characteristics.

With this lib you can setup, pair, configure and control the Crownstone family of products.

This lib implements protocol 0.7.0 of Bluenet which can be found here:
https://github.com/crownstone/bluenet/blob/f600fef8ddfc5fdfa1604ab1db47966eba6c75f4/docs/PROTOCOL.md


### Bluenet is initialized without arguments.
```swift
// this passes a view controller and app name to the lib.
// This is used for the pop ups for location usage and bluetooth warnings.
// Remember to add the capability and to add the description in your info.plist.
BluenetLib.setBluenetGlobals(viewController: self, appName: "Crownstone")

// start Bluenet
let bluenet = Bluenet()
```

### After this, you set the settings for bluenet

##### setSettings(encryptionEnabled: Bool, adminKey: String?, memberKey: String?, guestKey: String?, referenceId: String)

```swift
bluenet.setSettings(encryptionEnabled: true, adminKey: "1234567890abcdef", memberKey: "1234567890abcdef", guestKey: "1234567890abcdef", referenceId: "test")
```

Here you define if encryption is enabled, set the keys as either 16 character string or hexstring representing 16 bytes and finally the referenceId.
This is an ID that is added to the advertisement data of the verifiedAdvertisementData event so you can see which set of keys has decrypted the advertisement.

<hr>
## Setup complete!

Before we start using the library, we can check if it is ready using the isReady method:

#### isReady() -> Promise\<Void>
>Returns if the BLE manager is initialized.
>Should be used to make sure commands are not send before it's finished and get stuck.

These promises are from [PromiseKit](http://promisekit.org/), they are a great way to handle async operations! Information on how to use them is found on their website.

We can now start scanning for bluetooth devices and Crownstones. There are a number of scanning methods:

#### startScanning()
>Start actively scanning for BLE devices.
>Scan results will be broadcasted on the "advertisementData" topic.


#### startScanningForCrownstones()
>Start actively scanning for Crownstones (and Guidestones) based on the scan response service uuid.
>Scan results will be broadcasted on the "advertisementData" topic.


#### startScanningForCrownstonesUniqueOnly()
>Start actively scanning for Crownstones (and guidestones) based on the scan response service uuid.
>Scan results will be broadcasted on the "advertisementData" topic.
>
>This is the battery saving variant, only unique messages are shown.

#### startScanningForService(_ serviceUUID: String)
>Start actively scanning for BLE devices containing a specific serviceUUID.
>Scan results will be broadcasted on the "advertisementData" topic.

#### startScanningForServices(_ serviceUUIDs: [String])
>Same as startScanningForService but for an array of service UUIDs

#### startScanningForServiceUniqueOnly(_ serviceUUID: String)
>Start actively scanning for BLE devices containing a specific serviceUUID.
>Scan results will be broadcasted on the "advertisementData" topic.
>
>This is the battery saving variant, only unique messages are shown.

#### startScanningForServicesUniqueOnly(_ serviceUUIDs: [String])
>Same as startScanningForServiceUniqueOnly but for an array of service UUIDs

#### stopScanning()
>Stop actively scanning for BLE devices.


Using these methods can look like:

```swift
_ = bluenet.isReady()
.then{_ in bluenet.startScanningForCrownstones()}
```

The ```_ = ``` is used to indicate to PromiseKit that we will not be using the result of the promise.
```swift
.then{_ in bluenet.startScanningForCrownstones()} // this is a swift callback using trailing syntax
```

<hr>


## Using the events

This lib broadcasts the following data using its own eventbus:

|  topic                       |     dataType         |     when
|  --------------------------- |   :---------------   |    :-----
|  bleStatus                   |     String           |     Is emitted when the state of the BLE changes. Possible values: "unauthorized", "poweredOff", "poweredOn", "unknown"
|  setupProgress               |     NSNumber         |     Phases in the setup process, numbers from 1 - 13, 0 for error.
|  advertisementData           |     Advertisement    |     When an advertisement packet is received
|  verifiedAdvertisementData   |     Advertisement    |     When an advertisement has been decrypted successfully 3 consecutive times it is verified. Setup and DFU are also included since they don't need to be decrypted. This sorts out only your Crownstones.
|  nearestSetupCrownstone      |     NearestItem      |     When a verified advertisement packet in setup mode is received, we check the list of available stones in setup mode and return the closest based on RSSI.
|  nearestVerifiedCrownstone   |     NearestItem      |     When a verified advertisement packet is received, we check the list of available verified stones and return the closest based on RSSI.
|  nearestCrownstone           |     NearestItem      |     When a Crownstone advertisement (verified or not) packet is received, we check the list of available stones and return the closest based on RSSI.

You subscribe to the events using this method:

#### on(_ topic: String, _ callback: @escaping eventCallback) -> voidCallback
>Subscribe to a topic with a callback. This method returns an Int which is used as identifier of the subscription.
>This identifier is supplied to the off method to unsubscribe.

A voidCallback is defined as:

```swift
public typealias voidCallback = () -> Void
```

This callback can be invoked to unsubscribe from the event.

Example:
```swift
let unsubscribe = bluenet.on("advertisementData", {data -> Void in
if let castData = data as? Advertisement {
// Do something with the Advertisement
}
})

// a while later

unsubscribe() // now you are unsubscribed and the callback will not be invoked again!
```

<hr> 
## Doing Bluetooth things

There are a few generic methods to interact with Bluetooth devices. Most of the logic is contained in the sub modules however.

#### connect(_ uuid: String) -> Promise\<Void> 
>Connect to a BLE device with the provided UUID.
>This UUID is unique per BLE device per iOS device and is NOT the MAC address.
>Timeout is set to 3 seconds starting from the actual start of the connection.
>  - It will abort other pending connection requests
>  - It will disconnect from a connected device if that is not the required device.

#### disconnect() -> Promise\<Void>
>Disconnect from the connected device. Will also fulfil if there is nothing connected.
>Timeout is set to 2 seconds.

#### getBleState() -> CBCentralManagerState {
>Get the state of the BLE controller.

#### emitBleState() {
>Re-emit the state of the BLE controller over the bleState event.

#### waitToReconnect() -> Promise\<Void> {
> Wait before reconnecting. Can be used in a promise chain.

#### waitToWrite(_ iteration: UInt8?) -> Promise\<Void> {
> Wait before writing to a characteristic. Can be used in a promise chain.

<hr>
## Doing Crownstone things

We provide a (growing) number of methods to interact with the Crownstone. These are divided into sub modules. The submodules do not the full protocol at the moment. They will be added and completed over time.
So far we provide the following modules:
- control
- config
- setup
- power

Some methods require certain rights. If you provide the Admin key in setSettings, you have admin rights, if you only provide the member and guest keys you have member rights. All encryption is automatically taken care of
when using the methods in this lib. The required rights for certain commands can be found in the bluenet protocol documentation. 

The modules are called as follows:

```swift
bluenet.<moduleName>.<methodName>(args)

// so for example:

bluenet.control.commandFactoryReset()

```

### Control

#### recoverByFactoryReset(_ uuid: String) -> Promise\<Void> 
> This invokes the factory reset mechanism for a Crownstone with a specified bluetooth uuid (the handle). This mechanism is a
> fallback in case a user loses his encryption keys.
>
> Factory reset means to remove a Crownstone's encryption keys and reboot it in setup mode.
>
> Performing this procedure has to be done within 20 seconds of the powering of the Crownstone.


#### commandFactoryReset() -> Promise\<Void>
> Assuming you have provided the admin key in setSettings, you can use this method to factory reset the Crownstone.


#### setSwitchState(_ state: Float) -> Promise\<Void>
>Switches power intelligently.
>State has to be between 0 and 1. Currently this is clamped to either 0 or 1 but eventually this will dim the device between 0 and 1.
>This will be enabled once the Crownstone firmware has security measures in place against dimming devices that should not be dimmed or
>dimming devices that use more power than the Crownstone is rated for (100W).


#### reset() -> Promise\<Void>
> Restart the Crownstone. If you change a config setting, they will take effect after a restart. All memory and settings will be retained in a reset.

#### putInDFU() -> Promise\<Void>
> You can use this method to put this Crownstone into DFU mode. This allows it to be programmed over the air.

#### disconnect() -> Promise\<Void> 
> If you tell iOS to disconnect, it will actually remain connected for about 10 seconds. This method will tell the Crownstone to break the connection instead. This allows you to disconnect instantly.

#### keepAliveState(changeState: Bool, state: Float, timeout: UInt16) -> Promise\<Void> 
> Keepalives are meant to instruct the Crownstone what to do if it doesnot hear anything anymore. If the changeState is true, then the state and timeout (which is seconds) will be used. This means that the Crownstone will switch to match state once the timeout expires. If any keepalive is received in the meantime, the timeout will be postponed. Only the last received state will be executed. If changeState is false, the keepaliveState on the Crownstone will be cleared and nothing will happen when the timer runs out.

#### keepAlive() -> Promise\<Void> 
> This keepAlive is just to postpone the timeout and does not influence the set state.

### Config

#### IMPORTANT! After setting the settings you want, you need to call the reset() method: bluenet.control.reset() before the new settings are used!

#### setIBeaconUUID(_ uuid: String) -> Promise\<Void>
> This will set the iBeacon uuid. You will have to reboot the Crownstone for this to take effect.

#### setIBeaconMajor(_ major: UInt16) -> Promise\<Void>
> This will set the iBeacon major. You will have to reboot the Crownstone for this to take effect.

#### setIBeaconMinor(_ minor: UInt16) -> Promise\<Void>
> This will set the iBeacon minor. You will have to reboot the Crownstone for this to take effect.

#### setPWMPeriod(_ pwmPeriod: NSNumber) -> Promise\<Void>
> This will set the period of the PWM. Do not use this if you do not know exactly what you're doing.

#### setTxPower(_ txPower: NSNumber) -> Promise\<Void>
> This will set the power at which the Crownstone broadcasts its messages. Possible values are -40, -30, -20, -16, -12, -8, -4, 0, or 4.


### Setup

When you first get a Crownstone it will be in Setup Mode. It will also be in low-TX mode so you'll have to be near to perform the setup.
This method will allow you to easily setup your Crownstone. All encryption is taken care of by the lib. This step is used to tell the Crownstone
what it is, what it's encryption keys are and on which mesh address it should broadcast.

The setupProgress event is used to keep the user informed of the process.
#### setup(...) 
```swift
setup(
_ crownstoneId: UInt16,
adminKey: String,
memberKey: String,
guestKey: String,
meshAccessAddress: UInt32,
ibeaconUUID: String,
ibeaconMajor: UInt16,
ibeaconMinor: UInt16
) -> Promise<Void>
```

#### getMACAddress() -> Promise\<String> {
>Get the MAC address as a F3:D4:A1:CC:FF:32 String

### Device

This module allows you to get the firmware version.

#### getFirmwareRevision() -> Promise\<String>
> Returns a symvar version number like  "1.1.0"

This version is not encrypted. If you want to read it from a Crownstone that does not belong to your Sphere (so if you don't have it's encryption keys), you can get the version like this:

```swift

var revisionString = ""
bluenet.isReady()
    .then{ _ -> Promise<Void> in 
        bluenet.settings.disableEncryptionTemporarily()
        return bluenet.connect(<target>) 
    }
    .then{ _ -> Promise<String> in return bluenet.device.getFirmwareRevision() }
    .then{ firmwareRevisionString: String -> Promise<Void> in 
        bluenet.settings.restoreEncryption()
        revisionString = firmwareRevisionString
        return bluenet.disconnect()
    }
    .catch{ err in bluenet.settings.restoreEncryption() }

```

### Power

This is a lower level service, which requires admin access. In production Crownstones, this service is likely to be disabled.

#### switchRelay(_ state: UInt8) -> Promise<Void> {
>Set the switch state of the relay. 0 is off, 1 is on

#### switchPWM(_ state: UInt8) -> Promise<Void> {
>Set PWM value. Value of 0 is completely off, 100 is completely on.

### Usage Example

So how do we use this? Here is an example for the setup of a Crownstone:

```swift
let uuid = <something>

bluenet.isReady() // first check if the bluenet lib is ready before using it for BLE things.
.then{_ in return bluenet.connect(uuid)} // once the lib is ready, connect to the crownstone
.then{_ in bluenet.setup.setup(32, adminKey: "1234567890abcdef", memberKey: "1234567890abcdef", guestKey: "guestKeyForGirls", meshAccessAddress: 12324, ibeaconUUID: "b643423e-e175-4af0-a2e4-31e32f729a8a", ibeaconMajor: 123, ibeaconMinor: 456)} // once the lib is ready, start scanning
.then{_ -> Void in
print("DONE")
_ = self.bluenet.disconnect()
}
.catch{err in
print("end of line \(err)")
_ = self.bluenet.disconnect()
}

// similarly we can use:
//   bluenet.control.setSwitchState(...)
//   bluenet.config.setIBeaconUUID(...)
//   bluenet.power.switchRelay(...)
```
