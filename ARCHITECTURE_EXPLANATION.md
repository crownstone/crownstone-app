# Architecture Explanation

This document describes the general architecture of the Crownstone consumer application. This document is not meant to 
be a tutorial on how to use the application, but rather a description of the architecture of the application. 

It is assumed the reader has experience in building applications for either android or ios, as well as javascript/typescript/react developing experience.

If any terms are unclear, google them.

Any reference to the "user" implies the developer.

# Overview

Here is an index of all sections in the document

- [React Native](#react-native)
- [Project folder structure](#project-folder-structure)
- [Getting started](#getting-started)
- [App folder structure](#app-folder-structure)
- [Config](#config)
- [Entrypoint](#entrypoint)
- [Navigation](#navigation)
- [Dataflow & Core](#dataflow-&-core)
- [Background processing](#background-processing)
- [Syncing data with the cloud](#syncing-data-with-the-cloud)
- [Constellation](#constellation)
- [Localization](#localization)
- [Behaviour](#behaviour)

# React Native

The app is written in React native and typescript. The handling of the bluetooth interactions with the Crownstones is done 
via native libs, written in Kotlin for Android and Swift for iOS. The communication with these libs is done via a bridge.

The bridge file is also written in Kotlin and Swift. 

The promise based functions are going through the `BluenetPromise` function (BluenetPromise.ts) and the fire-and-forget methods
are going through the `Bluenet` object (Bluenet.ts).

# Project folder structure

The structure of the project is as follows:
- **android**   
  - the files required for the native side of android, including the bridge files, bluenet library and android config.
- **app**      
  - the typescript source, the built javascript source, the assets (images, videos etc.) and some required data files.
- **docs**      
  - detailed documentation for some components of the app. The BatchCommandHandler has been replaced by constellation.
- **e2e**       
    - util, config and tests files for end-to-end UI testing 
- **ios**       
  - the files required for the native side of ios
- **node_modules** 
  - all modules required by the javascript/typescript source. Created by yarn or npm.
- **screenshots**  
  - screenshots of the app in different versions
- **scripts**      
  - util scripts. Not used in the app directly, but used to parse or generate some parts of the app. Not required.
- **tests**       
  - jest based unittests
- **utils**        
    - some util scripts for android. Not required.

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


# App folder structure

This is the main body of the app. Located in /app/ts (!NOTE do not look at /app/js, this is all generated code by the typescript compiler).

- **backgroundProcesses**
    - Most of the background singletons, managed by the BackgroundProcessHandler.
- **cloud**
    - All code relating to cloud operations (sync, endpoints, util).
- **database**
    - The Redux database, it's reducers, enhancers, persistor and the storeManager
- **declarations**
    - Typescript type definitions as *.d.ts files
- **fonts**
    - Custom icon fonts with android or ios specific positioning corrections
- **languages**
    - Dutch and English language strings, managed by the Language module (./views/Languages.ts)
- **localization**
    - All code for indoor localization backend (not the views).
- **logging**
    - All code for the available loggers and util methods around it.
- **logic**
    - Modules that are considered abstract. These are math- or logic-heavy. Also includes constellation.
- **native**
    - Modules that closely communicate with the native side of things. Handle incoming advertisements, dfu process, bridge interface, setup helpers, localization handler.
- **notifications**
    - Code to handle local/remote push notifications
- **sensitiveData**
    - Keys for toon integration
- **util**
    - Util modules, used by the views to move calculation away from the views.
- **views**
    - The actual UI elements (*.tsx)


# Config

There exist a few files that house most of the configuration. All config is imported from the /app/ts/ExternalConfig, located in app/ts/ExternalConfig.ts.
The localConfig can be used to overwrite any config for development. The /app/tsLocalConfig.ts file is not committed (ignored by gitignore) but it can be 
created based on the /app/tsLocalConfig.template.ts file.

# Entrypoint

The app starts in the index.js file, located in the root of the project. This will initialize the routes for React Native Navigation
and start all the background processes.

Read the docs for React Native Navigation (!NOTE not React Navigation, there is a difference).

# Navigation

To facilitate navigation through the app (mostly because I did not like the RNN api), the NavigationUtils module was written.

This allows the user to easily navigate through the app. It keeps a shadow-account of the window state to facilitate the simplified api.

# Dataflow & Core

There are two main ways the data in the app is propagated.

## The React way
Data is provided as props to components. These props are often ids. The components themselves get the data from the database based on the ids.

## The Event way
There are events coming in from the native side. These can be subscribed to by the NativeBus.

Any events in the app are sent over the EventBus. These events can come from anywhere. Most notably, they come from the database enhancers.

### Database

The app runs off a redux database. The changes are handled by reducers and the state object is immutable (mostly). Any action that is dispatched to the database goes through the enhancers.

#### Cloud Enhancer

This enhancer will trigger update calls to the cloud outside of the syncer when an item is updated. For instance, when the name of a location is updated, the location data is updated in the cloud.

#### Event Enhancer

This enhancer will translate the mutation of the database to events on the eventbus. This way, views can subscribe to database changes which are relevant to them. Redux usually provides a similar API, but it will fire on ANY change.

#### Persistence Enhancer

This will persist the database to disk intelligently via the Persistor. The database is too big to comfortably stringify and destringify to and from disk. It chunks the tree and stores segments.
We ran into datacorruption before the persistor existed due to many sequential updates losing data. 

## Core

The core can be imported from anywhere. It provides the following modules:

```
core.store      // a reference to the store. This is the redux database. The most frequently used API is getState(), dispatch(action), batchDispatch([action, ...])
core.eventBus   // a reference to the main EventBus. Most of the app communicates over this eventBus. Most notable topic is databaseChange from the EventEnhancer.
core.nativeBus  // a reference to the NativeBus
core.bleState   // a quick reference to the state of the BLE driver
```

# Background processing

Many modules in the app exist as singletons, initialized by the BackgroundProcessHandler. These modules can be imported by any part of the app and used directly.

- **ActiveSphereManager**
  - Stateful singleton which keeps track of the active sphere. It propagates changes via the database. 
- **BackButtonHandler**
  - Stateful component which handles the android back button. Views can use its API to set overrides to the usage of the backbutton here. It also checks for default behaviour with the NavigationUtil.
- **BackgroundProcessHandler**
  - The main manager of all background processes. It initiates the background singletons based on the login state of the user. Can be used as a startingpoint to explore the backend of the app. 
- **BroadcastStateManager**
  - Handles the payload of the location broadcasts performed by the phone. This reacts to localization events and updates the payload accordingly.
- **CloudEventHandler**
  - Listener for dispatched cloud events. Cloud Events are removal propagation events like the deletion of an image for a removed location. Cloud events are handled before the data sync process. This module throttles the execution of the eventSyncer.
- **EnergyUsageCacher**
  - Module to keep a cache of the energyusage requested from the cloud for historical data. Purely in-memory.
- **FirmwareWatcher**
  - Module which keeps track of the firmware/bootloader/UICR versions of crownstones. Will use constellation to request the versions.
- **InviteCenter**
  - Module which keeps track of invitations to spheres and handles the accepting/rejecting of the invitations.
- **MapProvider**
  - Module which keeps maps of cloudId - localId, stone handle-stoneData. Updates automatically when required. Can be used anywhere to get an up-to-date datamap. 
- **MessageCenter**
  - Module which checks if messages should be shown 
- **NotificationHandler**
  - Handle all incoming push notifications
- **OverlayManager**
  - Provides an event-based API to show overlays.
- **PermissionManager**
  - Provides a permission map of what a user is allowed to do within a sphere based on his/her role.
- **Permissions**
  - Part of the permissionManager
- **PowerUsageCacher**
  - Module to keep a cache of power usage from advertisements. Purely in-memory
- **SpherePresenceManager**
  - Module which syncs user state based on store updates and SSE events. Allows showing the profile pictures of the other users in the sphere in the room overview. 
- **SphereStateManager**
  - Manages the behaviour enabled/disabled state.
- **SseHandler**
  - Handler of incoming SSE events from the cloud. Only used for presence at the moment.
- **StatusBarWatcher**
  - Provides a throttled API for setting the color of the statusbar.
- **StoneDataSyncer**
  - Large module which will keep behaviour and abilities in sync with the crownstones. Checks if updates are required and sends requests to constellation if they are.
- **TimeKeeper**
  - Module which updates the time on the Crownstones on certain intervals/changes
- **TrackingNumberManager**
  - Module to keep track of the tracking number (payload in the broadcasts used for presence in the mesh network) for this device.
- **UpdateCenter**
  - Keeps track of available firmware updates.
- **UptimeMonitor**
  - Writes uptime updates to log files for debug purposes.
- **WatchStateManager**
  - Will update the name map sent to the Apple Watch to map scanned handles to crownstone names.

There are a number of other modules launched by the BackgroundProcessHandler, in the method startSingletons.

Most notably:

- **DfuStateHandler**
  - Provides an API for scanned DFU Crownstones
- **SetupStateHandler**
  - Provides an API for scanned Setup mode Crownstones
- **EncryptionManager**
  - Determines which keysets the bridge should use.
- **LocalizationCore**
  - Contains the localization classifier, keeps track of the fingerprint managers.
- **LocationHandler**
  - Handles enter/exit sphere from the bridge, together with enter/exit room from the classifier and propagates it to the database. Also handles ibeacon tracking and initialization.
- **LocalizationMonitor**
  - Writes localization events to logs files for debug purposes
- **Scheduler**
  - Handles all callback and interval based actions in the app. setTimeout and setInterval do not work well when the app goes to the background. This module solves that. It lives off a tick call from the bridge and/or ibeacon events.
- **StoneManager**
  - This will receive BLE advertisements and forward them to the appropriate handlers.
- **StoneAvailabilityTracker**
  - This keeps a list of Crownstones that have been seen recently and provides and API to check this list.
  
# Syncing data with the cloud

The syncer is combined with the transferrers, which provide an API to create/update devices and map cloud data to local data and local data to cloud data.

We keep localIds (UUIDv4) and cloudIds (MongoDB ids). All references in the app are done via localIds. The cloudId is used for syncing.
This is described in [docs/SyncingV2.md](./docs/SyncingV2.md) which will forward you to the cloudv2 repo for more information.

# Constellation

Constellation provides an API to easily interact with crownstones via BLE connections. It manages multiple connections and mesh propagation. 
More can be read here [docs/ConstallationAPI.md](./docs/ConstallationAPI.md) 

# Localization

In the 6.0 release, we have moved localization from the native side to the node side. More can be read here: [docs/LocalizationV2.md](./docs/LocalizationV2.md)

# Behaviour

A PDF copy from the design doc for behaviour can be found here [docs/Behaviour.pdf](./docs/Behaviour.pdf)