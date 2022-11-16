# Architecture Explanation

This document describes the general architecture of the Crownstone consumer application. This document is not meant to 
be a tutorial on how to use the application, but rather a description of the architecture of the application. 

It is assumed the reader has experience in building applications for either android or ios, as well as javascript/typescript/react developing experience.

If any terms are unclear, google them.

Any reference to the "user" implies the developer.

# Overview

Here is an index of all sections in the document

- [Introduction](#introduction)
- [Project folder structure](#project-folder-structure)
- [React Native](#react-native)
- [Config](#config)
- [Entrypoint](#entrypoint)
- [Navigation](#navigation)
- [View components](#view-components)
- [Styles](#styles)
- [App folder structure](#app-folder-structure)
- [Translations](#translations)
- [Dataflow](#dataflow)
- [Core](#core)
- [Background processing](#background-processing)
- [Syncing data with the cloud](#syncing-data-with-the-cloud)
- [Constellation](#constellation)
- [Localization](#localization)
- [Behaviour](#behaviour)
- [Dev app](#dev-app)

# Introduction

A react native app consists of a navigator, a database and views. Views are the UI pages. Views contain components and are ideally not very stateful.
Since the Crownstone app is quite a complex app, there is more to it than a few views.

Due to the nature of BLE, state updates flow into the app without making a specific request (compared to a cloud service for instance). This means there is a logic
layer apart from the views.

Crownstone uses iBeacon messages to be able to run in the background on iOS (using CoreLocation ranging). These provide the liveblood for the app.
They generate ticks for the scheduler, they generate enter and exit sphere events and they allow the app to run in the background.

When in the foreground, we also want to listen to advertisements coming from the Crownstones. They contain state information of the Crownstone
and its neighbours. This is information like its switch state, power usage, energy usage, errors, if it requires setup etc.

We connect the background logic layer to the views via the database. Advertisemenst for instance, are screened, sorted and aggregated by the StoneManager and its StoneEntity subclasses.
These collect the latest state and update the database every few seconds.

Views subscribe to changes of certain, relevant, changes in the database. When these occur, the view rerenders, causing new data to be gotten from the database and the content updated.
In order to limit these rerenders, we need to throttle certain events. 

Some background modules will read the database and try to connect to crownstones to obtain or sync data from them, some will aggregate advertisements and provide an API for a view to get them 
if it requires the data. This is done using a singleton pattern. Javascript is singlethreaded and the import/export model makes it very easy to include these modules and use their data. I've tried to create (most) background processes as small, stateful libraries which provide a view with the most up-to-date information without the user having to worry about that.

This document should give you an overview of all the processes/modules that are available. For more information, just open them up and look at the code. They're generally not that large.


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


# React Native

The app is written in React native and typescript. The handling of the bluetooth interactions with the Crownstones is done
via native libs, written in Kotlin for Android and Swift for iOS. The communication with these libs is done via a bridge.

The bridge file is also written in Kotlin and Swift.

The promise based functions are going through the `BluenetPromise` function (BluenetPromise.ts) and the fire-and-forget methods
are going through the `Bluenet` object (Bluenet.ts).


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

We have chosen to use React Native Navigation because it is MUCH more performant than React Navigation. It has quirks, but we've worked around most of those by the NavigationUtil module.


# View components

I've created this app iOS first, android second. Mostly due to the fact that I'm an iOS user and use Crownstone as my smart home solution.

There are many components available to create your views with. Most of all, I'd recommend to see a view you like to use something from and go to the code to see which component it is.

I will highlight a few that I find most useful.

- **ListEditableItems**
  - This will take small JSON input data and generate a list of items like the settingsOverview and any other menu list.
  - It uses the EditableItem component, but instead of a react component it uses the json summary of the props. I found this cleaner to work with (no hassle with key props, easier parsing of the data within the list component).
- **Blur**
  - Android's performance of Blur is horrible whereas iOS uses it natively extensively. This component will do it's best to combine the two in a decent api.
- **Interview**
  - This provides a clean, card-based step-by-step UI system which is used for adding Crownstones, registering etc. It allowed me to make bite-sized UI chunks with a very little code.
- **Icon**
  - It wraps around pretty much all icon fonts and applies corrections automatically. Open it up to check the icon name format for the font you want to use.
- **Background**
  - Background and it's derived classes provide a consistent background. There's also an animated background which handles fading from one to another background image for you.
- **LiveComponent**
  - This is a wrapper around the React.Component. It will take care of the most common topbar actions like, back, dismissModal, cancel etc. as well as catch each forceUpdate that's called on it. These force updates are cancelled while in the background and applied when the app is opened (once, regardless of how many there were). This way the view does not redraw in the background.
  - Most views are using the LiveComponent instead of the React.Component if they're top-level views.
- **FadeInView**
  - There are a number of these but they are very nice to show/hide subviews (children) in an animated way.
    Later on in development I've chosen to keel local components close-by the places they are used unless they are reusable for multiple views.

I have also moved partially to functional components (these did not exist when we started) and created a number of easy-to-use hooks. Check those out in the /app/ts/views/components/hooks


# Styles

I've tried creating centralized styles but most of the time the styles are inline. The app has grown organically between 2016 and 2023. I've refactored a lot and have
moved towards creating reusable subcomponents with predefined, inline, styles. I know these might hurt performace since they are new each render and will cause additional renders (same for the callbacks)
but I did not want to optimize prematurely.

All the centralized styles are in the /app/ts/views/styles.ts file. Most notably, this contains screensizes and colors. The screensizes have some trickery to have it work for iOS and Android, but the idea is that each module can import them and they should work.
The colors are defined as color objects and they have quite an interesting api.

You can do color.red.hex for #ff0000, or color.red.rgba(0.3) for rgba(255,0,0,0.5). Additionally you can blend two colors via rgb or hsv. The colors are my attempt to limit the color palette within the app.


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


# Translations

The Language module is used by all views. It will pick the appropriate string-map and insert the strings into the views. This is used for translations.

There are many scripts to improve the translating experience, most hosted in the app-translation-tools repo. 


# Dataflow

There are two main ways the data in the app is propagated.

- **The React way**
  - Data is provided as props to components. These props are often ids. The components themselves get the data from the database based on the ids.

- **The Event way**
  - There are events coming in from the native side. These can be subscribed to by the NativeBus.

Any events in the app are sent over the EventBus. These events can come from anywhere. Most notably, they come from the database enhancers.

## Database

The app runs off a redux database. The changes are handled by reducers and the state object is immutable. Any action that is dispatched to the database goes through the enhancers.

#### Cloud Enhancer

This enhancer will trigger update calls to the cloud outside of the syncer when an item is updated. For instance, when the name of a location is updated, the location data is updated in the cloud.

#### Event Enhancer

This enhancer will translate the mutation of the database to events on the eventbus. This way, views can subscribe to database changes which are relevant to them. Redux usually provides a similar API, but it will fire on ANY change.

#### Persistence Enhancer

This will persist the database to disk intelligently via the Persistor. The database is too big to comfortably stringify and destringify to and from disk. It chunks the tree and stores segments.
We ran into datacorruption before the persistor existed due to many sequential updates losing data. 

# Core

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
  - Stateful singleton which keeps track of the active sphere. It provides and API with a number of internal checks and propagates changes via the database. 
- **BackButtonHandler**
  - Stateful component which handles the android back button. Views can use its API to set overrides to the usage of the backbutton here. It also checks for default behaviour with the NavigationUtil.
- **BackgroundProcessHandler**
  - The main manager of all background processes. It initiates the background singletons based on the login state of the user. Can be used as a startingpoint to explore the backend of the app. 
- **BroadcastStateManager**
  - Handles the payload of the location broadcasts performed by the phone. This reacts to localization events and updates the payload accordingly via the bridge.
- **CloudEventHandler**
  - Listener for dispatched cloud events. Cloud Events are removal propagation events like the deletion of an image for a removed location. Cloud events are handled before the data sync process. This module throttles the execution of the eventSyncer.
- **EnergyUsageCacher**
  - Module to keep a cache of the energyusage requested from the cloud for historical data. Purely in-memory.
- **FirmwareWatcher**
  - Module which keeps track of the firmware/bootloader/UICR versions of crownstones. Will use constellation to request the versions if they are missing in the database.
- **InviteCenter**
  - Module which keeps track of invitations to spheres and handles the accepting/rejecting of the invitations.
- **MapProvider**
  - Module which keeps maps of cloudId - localId, stone handle-stoneData. Updates automatically when required. Can be used anywhere to get an up-to-date datamap. 
- **MessageCenter**
  - Module which checks if messages should be shown. If you enter a room, leave a room or adhere to the delivery requirements of a message, this module triggers the delivery.
- **NotificationHandler**
  - Handle all incoming push notifications.
- **OverlayManager**
  - Provides an event-based API to show overlays. You can emit an event to the eventbus to show the overlays. In retrospect this could just have been a direct function call (allowing for typing too!)
 but this decision is mostly a legacy one, and I've never bothered to update it. 
- **PermissionManager**
  - Provides a permission map of what a user is allowed to do within a sphere based on his/her role.
- **PowerUsageCacher**
  - Module to keep a cache of power usage from advertisements and provides an API to get the data. Purely in-memory.
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

# Dev app

There is a whole separate part of the app. If you activate the developer mode by quickly tapping next to the profile picture in the my Account page in the settings, a toggle will appear to enable it.
If you then go into the developer mode view and quickly tap on the title of that view, the option for the developer app becomes available. This goes into a whole different app stack for dev options.

This is meant for people who know the bluenet protocol and just need a quick way to scan for crownstones, theirs or others. It provides a way to upload firmware zips you put on your phone as well.

