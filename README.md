iOS & Android App for the Crownstone.

This is heavily work in progress. iOS will be done first, after which it will be updated to also support Android.

The native libs are not in this project directly.

## Setup

Assuming you've already installed nodejs, npm and Carthage (for ios)

```
npm install
rnpm link
cd ios
carthage update --platform ios
cd ..
```

## Commands

Run the tests:

npm test

Run the lint:

npm run lint

Run react-native

react-native run-ios


If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.22