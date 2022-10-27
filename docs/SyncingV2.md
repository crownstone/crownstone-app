
The mechanics and the datamodels are documented in the cloudv2 repo.

# Adding a model to the syncer

To add a new thing to the syncers, the following steps are required on the side of the App:
- Create a Transferrer (see ./app/ts/cloud/sections/newSync/transferrers/)
- Create a syncer      (see ./app/ts/cloud/sections/newSync/syncers/)
- Add the prepare step from the syncer to the composeState mehod in SyncNext.ts
- Add the process step from the syncer to the processSpheres method in SyncNext.ts
- Create at least a delete method for an item of your model to the CLOUD api.

## Direct feedback
If you want to immediately respond when the local modal is edited, add the handlers to the cloudEnhancer.ts

## Waitless interaction
If you do not want to wait on the cloud when deleting an element of your model, add handlers in the syncEvent for deletion of the cloud.

