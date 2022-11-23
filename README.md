# iOS & Android App for the Crownstone.


# Getting Started

When first checking out the repo, run yarn (if you don't have it, google and install)

```
yarn
```

This will check out, download and install all required modules for node.

If you want to work on the ios version of the app:

```
cd ios
pod install
```

To install the modules for ios to compile. Android does not require this.

To start the typescript compiler, run:
```
npm start
```

This will dynamically recompile the app on changes made to /app/ts/**/*.

To run the react server for development (using debug builds via either android studio or xcode):

```
npm run react
```

If you're building the Android app, checkout the android bluenet library, copy or symlink the bluenet folder from the lib to the android folder.

From here on, you can build the app as you would any other app for android and ios.



## State

The Android development is always a few weeks behind the iOS development, especially with respect to the graphical user interface. 

The application makes use of separate libraries (so-called bluenet libraries) that are native to the platform. 
This is on purpose so that people can be make use of the Crownstone libraries without the need to use React Native.
See below for getting the libraries.

## Issues and feature requests

Do you encounter some issues or would you like to see a particular feature, file them directly at our [Github issues tracker](https://github.com/crownstone/CrownstoneApp/issues).

## Download

The compiled app can be downloaded from [Crownstone](https://crownstone.rocks/app/). 

<img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_welcome.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_login.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_preferences.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_power_use.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_power_use2.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_plug_on.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_pick_icon.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_overview_start.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_overview4.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_floating.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_fingerprinting.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_dfu.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_behaviour3.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_behaviour2.jpg" width="196px" height="348px"/>

## Setup

### React Native

Make copies of ./js/LocalConfig.template.js and ./sentrySettings.template.js and rename them to ./js/LocalConfig.js and ./sentrySettings.js.

Assuming you've already installed npm, nodejs and yarn. You can get Yarn here: https://yarnpkg.com/en/docs/install
* nodejs
* Yarn, can be obtained at [yarnpkg.com](https://yarnpkg.com/en/docs/install).
* Carthage (for iOS)
* Android Studio (for Android)

Make sure typescript 2.2 or higher is installed using:

```
npm install -g typescript
```

To download all dependencies, use Yarn:

```
yarn
```

To run the compiler, use:

```
tsc --watch
```

or

```
npm start
```


### iOS

In the ios folder, use Carthage to download the dependencies.

```
carthage bootstrap --platform iOS --no-use-binaries
```

### Android

- Clone the bluenet lib for android to another dir, and copy the `bluenet` module to the `android` dir of the app:

        cd ..
        git clone https://github.com/crownstone/bluenet-android-lib.git
        cp -r bluenet-android-lib/bluenet CrownstoneApp/android
        cd CrownstoneApp

- Import the project in Android Studio

        File > New > Import Project ...

    Choose the android dir.

#### Running

- Start the react server in a seperate terminal:

        react-native start

- Reverse the port (only needs to be done once after plugging in the phone):

        adb reverse tcp:8081 tcp:8081

- Press the play button in android studio

#### Issues

Running yarn (or anything else) may confuse android studio. If gradle fails, try closing android studio, run `clean.sh`, and import the project again.




## Commands

Run the tests:

```
npm test
```

Run react-native

```
react-native run-ios
```

or (untested):
```
react-native run-android
```

## Troubleshooting

If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.42


If you get a lot of these messages in the XCode console:
```
__nw_connection_get_connected_socket_block_invoke
```

Add this global variable to your build config:
```
Xcode menu -> Product -> Edit Scheme...
Environment Variables -> Add -> Name: "OS_ACTIVITY_MODE", Value:"disable"
```

If you get errors with xcode 11:
```
Unknown argument type 'attribute' in method -[RCTAppState getCurrentAppState:error:]. Extend RCTConvert to support this type.
```
That means you need to update the React Native version to 59.9

If you get a compilation issues in xcode 10,
"config.h not found"
copy the ios-configure-glog.sh from /node_modules/react-native/scripts to /node_modules/react-native/thirdParty/glog and run the script. Clean and rebuild


If you get libfishhook.a is missing, go to RTCWebSocket and re-add the libfishhook.a in the link binary with libraries panel.

react-transform-hmr errors: run this to start the server --> react-native start  --reset-cache

If you get "Argument list too long: recursive header expansion failed at <user_path_to_app>/node_modules/react-native-camera/ios/../../../ios/build/Index/DataStore/v5/records/R4.",
remove the $(SRCROOT)/../../../ios from the Framework Search Path of the react-native-camera library xcode project.

## Copyrights

The copyrights (2014-2017) belongs to the team of Crownstone B.V. and are provided under an noncontagious open-source license:

* Authors: Alex de Mulder, Bart van Vliet
* Date: 1 Apr. 2016
* Triple-licensed: LGPL v3+, Apache, MIT
* Crownstone B.V., <https://www.crownstone.rocks>
* Rotterdam, The Netherlands

# License

## Open-source license

This software is provided under a noncontagious open-source license towards the open-source community. It's available under three open-source licenses:
 
* License: LGPL v3+, Apache, MIT

<p align="center">
  <a href="http://www.gnu.org/licenses/lgpl-3.0">
    <img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
  </a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache 2.0" />
  </a>
</p>

## Commercial license

This software can also be provided under a commercial license. If you are not an open-source developer or are not planning to release adaptations to the code under one or multiple of the mentioned licenses, contact us to obtain a commercial license.

* License: Crownstone commercial license

# Contact

For any question contact us at <https://crownstone.rocks/contact/> or on our discord server through <https://crownstone.rocks/forum/>.
