# Bluenet-lib-ios
### Bluenet lib for iOS

[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)

# Getting started

The Bluenet ios lib uses Carthage to handle it's dependencies. It's also the way you install Bluenet ios in other projects.
If you're unfamiliar with Carthage, take a look at the project here: https://github.com/Carthage/Carthage

To get the Bluenet ios lib up and running, first you need to have Carthage installed. Then navigate to the project dir in which you want to include Bluenet ios and create a cartfile if one did not exist yet.
(a cartfile is just a file, called "Cartfile" without extensions. Edit it in a text editor or XCode).

To add the dependency to the Cartfile, copy paste the lines below into it, save it and close it:

```
# BluenetLibIOS
github "crownstone/bluenet-ios-lib"
```

Once this is finished, run the following command in your terminal (in the same folder as the Cartfile)

```
carthage bootstrap --platform iOS --no-use-binaries
```

All dependencies will then be downloaded, built and placed in a Carthage/Build folder. You then drag the frameworks into your XCode project and you're good to go!

For more information on this process, take a look at the Carthage repo.


## IMPORTANT

If you want to be able to receive location updates (iBeaconPackets or the room events) you NEED to add the "Location updates" to the "Background Modes" in the capabilities. Keep in mind that doing so may
complicate the acceptance process in the App Store if you cannot prove that using the background location benefits the end user.



## If you're more of a copy-paste starter

There is an example app available that has the library implemented:
https://github.com/crownstone/bluenet-ios-example


## Logging and Bluenet-ios-shared

For a clean split of modules, we have a core of shared data models and the logging class. This can be found here: https://github.com/crownstone/bluenet-ios-shared

The docs of the Logging are there as well. Log methods of bluenet-ios-lib can be called as shown below:

```swift
BluenetLib.LOG.<method>

// example: 
BluenetLib.LOG.setPrintLevel(level: .INFO)
```

# API

This lib has two parts, the BLE one called Bluenet and the location one called BluenetLocalization.
We use PromiseKit to handle all async events. If you see the return type is Promise<DataType> that
means this method is asynchronous and you'll have to use promises.

To use the lib, you will need to define a few of it's globals using the method below.

#### setBluenetGlobals(viewController: UIViewController, appName: String)
The viewcontroller is used to trigger the permission alerts and the appName is used in these alerts. The logging commands are for writing logs to file or logs to console. By default, console is enabled and to file is disabled.

# Bluenet (BLE)

[Read the docs here](./BluenetLib.md)

# BluenetLocalization (iBeacon and indoor localization)

[Read the docs here](./BluenetLocalizationLib.md)
