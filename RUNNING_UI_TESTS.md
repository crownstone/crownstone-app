# Appium UI tests

# Preparation


## Local cloud

Checkout the local cloud container

```
git clone git@github.com:crownstone/cloud-test-container.git ../cloud-test-container
```

Follow the steps in that readme, and continue when the clouds are started.

## Detox

install the detox cli
```
npm install -g detox
```

We use jest:
```
npm install -g jest
```

### iOS preperation

[Install applesimutils](https://github.com/wix/AppleSimulatorUtils)

```angular2html
brew tap wix/brew
brew install applesimutils
```

### Config

The config file is `.detoxrc.json`.

## Building the app

Ensure the app is built for the configuration you want to tests (see .detoxrc.json)

## Running react

If you're debugging an app, ensure you are running the React builder
```
npm run react
```

## IP address

In order for the test app to find the test cloud, the script needs the IP address of your computer.
By default, it will use the first result of `ipconfig`, but that is not always correct. In that case, provice your IP address to the script.

# iOS

We use detox to run the tests.

```
./run_UI_tests_ios.sh
```

# Android

## Debug build

First build the app:
```
cd android
./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
cd ..
```

When running a test on a debug build, make sure the react-native server is running:
```
cd android
./reverse.sh
cd ..
react-native start
```

## Release build

First build the app:
```
cd android
./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release
cd ..
```

Then run the tests:
```
./run_UI_tests_android.sh
```



# Developing UI tests

In android studio, you can find out the ids of GUI elements with the "layout inspector", while running a debug build.


