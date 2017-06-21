### Changelog

To be Released:

- Added a few new Icons for rooms and appliances.

--- iOS release submitted 2017-6-21 as 1.9.1

- Fixed the app logging out every week at random.
- [iOS] Fix bug that caused members and guests not to be able to switch Crownstones.
- Fix bug that caused the profile pictures of other users not the be shown in overview (user might have to change their picture once in order for it to show up).
- Redesign of device overview to accommodate future features.
- Fixed bug in background process so near/away and room enter/exit won't occasionally stop working
- Fixed bug that crashed the app on logout.
- Ensured that DFU and Setup work nicely in the background.
- Fixed user permissions.
- Fixed bug in DFU causing the Crownstone to be stuck in DFU mode.
- Implemented push notification handlers for future improvements.
- Added hub mode so a Crownstone can be switched from the cloud REST api (developer option).
- Fix bugs related to animated fade in and out views.
- Show and handle errors of the hardware in the app.
- Fix validation on registration.
- Fix forced logout after 6 days bug.
- Update the other users in rooms every 10 seconds but only if the app is on screen.
- Show version information of devices in their edit screen.

--- iOS release submitted 2017-5-22 as 1.8.2

- Fixed issue that a setup stone is still visible after it has been set up.
- Improved responsiveness of text fields.
- Added ability to update the bootloader of the Crownstones from the app.
- Added ability to update the firmware of the Crownstones from the app.
- Introducing a new architecture for more efficient and reliable communication with the Cloud.
- Increased the minimum sphere exit timeout to 5 minutes, with a default of 10.
- Added battery saver
- Fixed Option to turn Crownstones on when its dark outside
- Added privacy options
- Large refactor of the switching on location changes
- Now showing the version number on the splash screen and in the settings overview.
- Revoked permission of Guest to setup Crownstones.

--- iOS release submitted 2017-1-2, Released 2017-02-17 as 1.6.0.4

- Added option to only turn on Crownstones when it is dark outside.
- Changed the behaviour interface to be easier to use.
- [Android] Setup Localization button to sidebar.
- [Android] Added force quit to sidebar.
- [Android] Fixed picker object for Android
- Added Tap to Toggle tutorial
- Added timeout (60 seconds) for pending bluetooth commands that do not complete to make sure we do not block all bluetooth traffic.
- [Android] Show an alert if the user tries to close the app with the back button.
- Make sure the text field data is committed when the keyboard is hidden.
- During Crownstone setup, if the Cloud connection fails, the setup is now properly terminated.
- Setting up a known Crownstone will correctly transfer the name and icon.
- Improved logging on essential elements of the app.
- KeepAlive are now repeating to avoid Crownstones turning off while the user is still in the house.
- User commands will now have priority over background user events.
- New Crownstones are 'searching' by default if they are never seen before.
- Improved cleanup when exiting sphere.
- The registration conclusion will not go to the login screen instead of the overview.

--- iOS release submitted 2017-1-2, Released 2017-01-05 as 0.72

- Fixed the near/away not always switching.
- Improved distance estimate for near/far.
- Made the register and profile page not require a tap to close the keyboard before moving on.
- Made the tap-to-toggle trigger when its a bit further away (-48).
- Removed looking for Crownstone if it is disabled during deletion of Crownstone.
- [Android] added fingerprint sanity check due to bug in lib.
- Show range indicator orange if within tap to toggle range.
- Fixed unsteady app identifier. Should reduce the amount of Devices in the cloud.
- Improved moving Crownstones to room communication: It shows the Crownstone being moved when adding rooms even if it isn't floating.
- Made the room overview show the amount of Crownstones when not using indoor localization.
- Separated the fingerprint validation.
- Improved the room overview explanation to link to floating crownstones when required.

- Relaxed the conditions for training in rooms with bad reception.
- Fixed navigation bugs
- Fixed interface presenting the first Crownstone
- Improved user guidance with setting up room-level localization
- Tweaks and small fixes
