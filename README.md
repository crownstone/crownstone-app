# Crownstone iOS & Android app 

The Crownstone iOS and Android apps are work in progress. 
The roadmap of the software development can be found at [Trello](https://trello.com/b/6rUcIt62/crownstone-transparent-product-roadmap).

The Android development is always a few weeks behind the iOS development, especially with respect to the graphical user interface. 

The application makes use of separate libraries (so called bluenet libraries) that are native to the platform. 
This is on purpose so that people can be make use of the Crownstone libraries without the need to use React Native.
See below for getting the libraries.

## Download

The compiled app can be downloaded from [Crownstone](https://crownstone.rocks/app/). 

![Overview screen](https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/documentation/crownstone-app-overview.jpeg)
![Room screen](https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/documentation/crownstone-app-room.jpeg)

## Setup

Dependencies:

* nodejs
* Yarn, can be obtained at [yarnpkg.com](https://yarnpkg.com/en/docs/install).
* Carthage (for iOS)
* Android Studio (for Android)

Setup instructions:

```
yarn
react-native link
cd ios
carthage bootstrap --platform iOS --no-use-binaries
cd ..
```

### Android

1. Get the nodejs modules:

        yarn

2. Clone the bluenet lib for android:

        cd android
        git clone https://github.com/crownstone/bluenet-lib-android.git bluenet
        cd ..

3. Get the bluenet localization lib:

todo

4. Import the project in Android Studio

        File > New > Import Project ...

    Choose the android dir.

## Commands

Run the tests:

    npm test

Run the lint task:

    npm run lint

Run react-native for iOS:

    react-native run-ios

Alternatively, run reactive for Android:

    react-native run-android


If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.22

## Todo

The slider needs to be edited in order to work, includes are wrong.

File issues at the [Github Issue Tracker](https://github.com/crownstone/CrownstoneApp/issues).

## Copyrights

The copyrights (2014-2017) belongs to the team of Crownstone B.V. and are provided under an noncontagious open-source license:

* Authors: Alex de Mulder, Bart van Vliet
* Date: 1 Apr. 2016
* Triple-licensed: LGPL v3+, Apache, MIT
* Crownstone B.V., <https://www.crownstone.rocks>
* Rotterdam, The Netherlands

