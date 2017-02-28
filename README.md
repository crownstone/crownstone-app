iOS & Android App for the Crownstone.

The native libs are not in this project directly.

## Setup

### React Native

Assuming you've already installed npm, nodejs and yarn. You can get Yarn here: https://yarnpkg.com/en/docs/install

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

or:
```
react-native run-android
```

If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.22
