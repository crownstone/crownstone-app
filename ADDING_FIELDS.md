### Adding fields to the Redux Store (and Cloud)

If you add a new data field to the redux store, there are a few things to keep in mind.
This document will list the things to note. We will assume the first step will be to add the new field to the default values
of the reducer in ./js/router/store/reducers/*

- Update the handlers in the reducer. All the actions that are should modify this field (usually the update) should get an extra line.
- If this field is stored in the cloud, add it to the cloud model.
- Add it to the sync function (for a stone, there are 3 places: on add, on update from phone to cloud, on update from cloud to phone)
- Add it to the cloudEnhancer to make sure that changes are being pushed to the cloud.