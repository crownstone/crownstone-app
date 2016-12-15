iOS & Android App for the Crownstone.

This is heavily work in progress. iOS will be done first, after which it will be updated to also support Android.

The native libs are not in this project directly.

## Setup

Assuming you've already installed nodejs, yarn and Carthage (for ios). You can get Yarn here: https://yarnpkg.com/en/docs/install

```
yarn
react-native link
cd ios
carthage bootstrap --platform iOS --no-use-binaries
cd ..
```

### Android

1. Clone the bluenet lib for android:

        cd android
        git clone https://github.com/crownstone/bluenet-lib-android.git bluenet
        cd ..

2. Import the project in Android Studio

        File > New > Import Project ...

    Choose the android dir.

## Commands

Run the tests:

npm test

Run the lint:

npm run lint

Run react-native

react-native run-ios


If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.22

The slider needs to be edited in order to work, includes are wrong.
