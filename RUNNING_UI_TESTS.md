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

### Config

The config file is `.detoxrc.json`.

## Building the app

Ensure the app is built for the configuration you want to tests (see .detoxrc.json)

## Running react
If you're debugging an app, ensure you are running the React builder
```
npm run react
```

# iOS

We use detox to run the tests.

```
./run_UI_tests.sh
```

