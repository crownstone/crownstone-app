### Changelog

To be Released:

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
