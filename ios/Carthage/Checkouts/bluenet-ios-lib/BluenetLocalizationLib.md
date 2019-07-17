# Bluenet Localization

Bluenet Localization.
This lib is used to handle the iBeacon functionality of the Crownstone. It wraps around the CoreLocation services to handle all iBeacon logic.

You can load a classifier into this module using the insertClassifier method.

You can use the TrainingHelper class to train a set of TrainingData which you can put into the basic classifier.

As long as you can ensure that each beacon's UUID+major+minor combination is unique, you can use this
localization lib.

# Getting Started

### BluenetLocalization is initialized without arguments.
```
// this passes a view controller and app name to the lib.
// This is used for the pop ups for location usage and bluetooth warnings.
// Remember to add the capability and to add the description in your info.plist.
BluenetLibIOS.setBluenetGlobals(viewController: self, appName: "Crownstone")

// start the Bluenet Localization lib.
let bluenetLocalization = BluenetLocalization()
```


# Using the events

This lib broadcasts the following events:


|  topic:                  |    dataType:          |    when:
| :----------------------- | --------------------- | :-------------------------------------- |
|  "iBeaconAdvertisement"  |    [iBeaconPacket]    |    Once a second when the iBeacon's are ranged   (array of iBeaconPacket objects)
|  "enterRegion"           |    String             |    When a region (denoted by referenceId) is entered (data is the referenceId as String)
|  "exitRegion"            |    String             |    When a region (denoted by referenceId) is no longer detected (data is the referenceId as String)
|  "enterLocation"         |    Dictionary         |    ["region": String, "location": String] when a classifier returns a new location, we emit the enter location event. If we were in a location before, there will be an exit location event as well. The region field is the referenceId of the region.
|  "exitLocation"          |    Dictionary         |    ["region": String, "location": String] when a classifier returns a new location, we emit the exit location event if we were in a different location before.
|  "currentLocation"       |    Dictionary         |    ["region": String, "location": String] returns the result of the classifier each second as long as it is a valid measurement.



You subscribe to the events using this method:

#### on(_ topic: String, _ callback: @escaping eventCallback) -> voidCallback
> Subscribe to a topic with a callback. This method returns an Int which is used as identifier of the subscription.
> This identifier is supplied to the off method to unsubscribe.

A voidCallback is defined as:

```
public typealias voidCallback = () -> Void
```

This callback can be invoked to unsubscribe from the event.

Example:
```
let unsubscribe = BluenetLocalization.on("enterRegion", {data -> Void in
if let castData = data as? String {
// Do something with the region
}
})

// a while later

unsubscribe() // now you are unsubscribed and the callback will not be invoked again!
```

# Permissions

If you want to be able to receive location updates (iBeaconPackets or the room events) you NEED to add the "Location updates" to the "Background Modes" in the capabilities. Keep in mind that doing so may
complicate the acceptance process in the App Store if you cannot prove that using the background location benefits the end user.

You can manually request the permission using the following method.

#### requestLocationPermission() {
> The user can use this method to request the permission for the usage of the location.

If you do not use this method, the permission will be asked on calling any of the tracking iBeacon methods below.

# User Location

#### requestLocation() -> CLLocationCoordinate2D 
> This provides a very rough estimate of the users location. The location is cached for battery saving. This is accurate up to 3km radius (kCLLocationAccuracyThreeKilometers).

# Tracking iBeacons

#### trackIBeacon(uuid: String, referenceId: String)
> This method configures starts tracking the iBeaconUUID you provide. The dataId is used to notify
> you when this region is entered as well as to keep track of which classifiers belong to which data point in your reference.
> When this method has been used, the iBeaconAdvertisement event will update you when new data comes in.


#### clearTrackedBeacons()
> This will stop listening to any and all updates from the iBeacon tracking. Your app may fall asleep.
> It will also remove the list of all tracked iBeacons.



#### stopTrackingIBeacon(_ uuid: String)
> This will stop listening to a single iBeacon uuid and remove it from the list. This is called when you remove the region from
> the list of stuff you want to listen to. It will not be resumed by resumeTracking.



#### pauseTracking()
> This will pause listening to any and all updates from the iBeacon tracking. Your app may fall asleep. It can be resumed by
> the resumeTracking method.



#### resumeTracking()
> Continue tracking iBeacons. Will trigger enterRegion and enterLocation again.
> Can be called multiple times without duplicate events.


#### forceClearActiveRegion()
> This can be used to have another way of resetting the enter/exit events. In certain cases (ios 10) the exitRegion event might not be fired correctly.
> The app can correct for this and implement it's own exitRegion logic. By calling this method afterwards the lib will fire a new enter region event when it sees new beacons.


# Indoor localization

Starting and stopping the usage of the classifier will also start and stop the emitting of the "enterLocation", "exitLocation"
and "currentLocation" events. If there is no TrainingData loaded, none of these events will be emitted regardless. The default state of the
indoor localization is **OFF**.

#### startIndoorLocalization()
> This will enable the classifier. It requires the TrainingData to be setup and will trigger the current/enter/exitRoom events
> This should be used if the user is sure the TrainingData collection process has been finished.


#### stopIndoorLocalization()
> This will disable the classifier. The current/enter/exitRoom events will no longer be fired.


## Collecting Training Data

If you decide to use our basic classifier (available here: https://github.com/crownstone/bluenet-ios-basic-localization) you can collect training data using the
TrainingHelper class. You do not need to know the format of the TrainingData in order to use it. The storage of the TrainingData is just storing a String with the appropriate referenceId and locationId.

To start collecting trainingData, you first make a trainingHelper and supply it with a reference to your BluenetLocalization variable:

```swift
// bluenetLocalization is defined at the top of this document.
let trainingHelper = TrainingHelper(bluenetLocalization: bluenetLocalization)

```

In order to collect trainingData, you will need to be tracking an iBeacon region. For successful classification, there should be at least 3 iBeacons visible to the phone during the training process.
If there are less iBeacons, our basic classifier will return **nil**.

#### startCollectingTrainingData()
> Start collecting the training dataset.

#### pauseCollectingTrainingData()
> Pause collecting a training dataset. Usually when something in the app would interrupt the user.

#### resumeCollectingTrainingData()
> Resume collecting a training dataset.

#### abortCollectingTrainingData()
> Stop collecting a training dataset without loading it into the classifier.

Once your usecase has determined that the Training Dataset is big enough, you call the finish method:

#### finishCollectingTrainingData() -> String?
> Finalize collecting a training dataset. Returns a stringified JSON dataset which you can load into our basic classifier.

## Storage of fingerprints

The lib does not store the training dataset. This is up to your app. You get the training dataset after collection using the finishCollectingTrainingData method.

## Usage of Training Data

You can read how to use the classifier here: https://github.com/crownstone/bluenet-ios-basic-localization

Alternatively, you can create your own classifier by adhering to the protocols of this shared module:

https://github.com/crownstone/bluenet-ios-shared
