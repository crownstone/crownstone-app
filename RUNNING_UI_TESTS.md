# Appium UI tests

# Preparation


## local cloud

Checkout the local cloud container

```angular2html
git clone git@github.com:crownstone/cloud-test-container.git ../cloud-test-container
```

Follow the steps in that readme, and continue when the clouds are started.

## detox

install the detox cli
```angular2html
npm install -g detox
```

## building the app

Ensure the app is built for the configuration you want to tests (see .detoxrc.json)

## running react
If you're debugging an app, ensure you are running the React builder
```angular2html
npm run react
```

# iOS

We use detox to run the tests. 

```angular2html
./run_UI_tests.sh
```

