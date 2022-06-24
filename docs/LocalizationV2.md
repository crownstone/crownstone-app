# Localization V2

In V2, we will run an optimized KNN based classifier in JS instead of native ones.
https://docs.google.com/document/d/1tUMBqFINuMG-Yqie1Qs2f9KWtA59THNF55YZXPViZRk/edit#bookmark=id.g0lq03em8jok

## Datamodel

The fingerprint will be part of the location data model. The current (v1) fingeprints are singular and exist in the 
```location.config.fingerprintRaw``` and ```location.config.fingerprintParsed``` fields. Parsed is not used.

We will migrate the fingerprints to the top of the location model:

```
location.fingerprints : {
    raw:       Record<fingerprintId, FingerprintData>,
    processed: Record<processedFingerprintId, FingerprintProcessedData>, 
}
```

The raw fingerprint data will be defined as follows and is stored on the cloud like this:

```
type FingerprintType = 'IN_HAND' | 'IN_POCKET' | 'AUTO_COLLECTED'
type CrownstoneIdentifier = string; // maj_min as identifier representing the Crownstone.

interface FingerprintData {
  id: string,
  cloudId: string | null,
  type: FingerprintType,
  createdOnDeviceType: string, // ${device type string}_${userId who collected it}
  crownstonesAtCreation: CrownstoneIdentifier[], // maj_min as id representing the Crownstone.
  data: {
    dt: number, // ms diff from createdAt
    data: Record<CrownstoneIdentifier, rssi>[]
  }[],
  updatedAt: timestamp,
  createdAt: timestamp,
}
```

the ```identifier``` is the ```${iBeacon Major}_${iBeacon Minor}``` of the Crownstone. This uniquely identifies the Crownstone 
without a localId, cloudId or CrownstoneId. The CrownstoneId can be reused, while the major and minor are random.

the ```FingerprintType``` is one of the following:

- ```IN_HAND```
- ```IN_POCKET```
- ```AUTO_COLLECTED```

Processing a fingerprint is mandatory and will be done on the phone. The processed data is not stored on the cloud.

Processing has a few steps:
- If a Crownstone is in the crownstonesAtCreation list and no longer exists, it will be removed from the data.
  - based on the classifier, if we expect a crownstone in the fingerprint and it is not in the vector, it will get value 1 in the vector. Any distance from that missing value is large.
    To avoid this, we will remove the values of the removed Crownstone from the fingerprint.
- If we have not transformed the fingerprint yet, and it is possible (if the fingerprint has not been collected on this phone), check the available transformations. Perform if possible.
- Transform the RSSI values to sigmoids.

```
type TransformState  = 'NOT_REQUIRED' | 'TRANSFORMED_EXACT' | 'TRANSFORMED_APPROXIMATE'

interface FingerprintProcessedData {
  id: string,
  fingerprintId: string, // processed based on parent id
  type: FingerprintType,
  transformState: TransformState,
  crownstonesAtCreation: CrownstoneIdentifier[], // maj_min as id representing the Crownstone.
  data: {
    dt: number, // ms diff from createdAt
    data: Record<CrownstoneIdentifier, sigmoid>[]
  }[],
  processingParameterHash: string, // this contains the parameters used to process the data. (sigmoid)
  transformedAt: timestamp,  // if the transform data has changed since the last time it was transformed, repeat the transform.
  processedAt:   timestamp,  // if the base fingerprint has changed since the processing time, update the processed fingerprint.
  createdAt:     timestamp,
}
```




# Classification Process

## Pre-processing

We will check if we have to process the fingerprints.

## Preparation

In the sphere, we collect all crownstones that exist and create a sorted vector keymap.

```
{
    sphereId_1: [identifier_1, identifier_2, ...],
    ...
}
```

Each fingerprint is loaded. Datafields of Crownstones that exist but are not in the fingerprint, will be set to 0.

A separate mask will be kept to modify the vector to set measurements of Crownstones that are missing in the fingerprint to 0 before determining distance.

## Classification

Each incoming iBeacon vector will be parsed in 2 steps.

- Create a measurement vector from the iBeacon vector and transform the values. This will result in a sorted vector of sigmoids.

- For each fingerprint to match against, copy the vector and apply the mask.

- Determine distance.

- Get lowest distance and return the fingerprint that matches.

## Post-processing

TODO

Temporal smoothing?


## Issues

Fingerprints with less Crownstones inherently give lower distances. This could be normalized?


# Transformations

These transformation datasets will live at app-level (above spheres).

They can be trained by putting 2 phones close to eachother and pressing the transform button.

TODO: work this out..



# User feedback

We will give the locations a fingerprint quality score. This is based on the following criteria:

- Is there an in-hand fingerprint AND an in-pocket fingerprint? (if not in pocket -10%);
- Is there a requirement for transformation? If so, -10% for not transformed, -5% for approximate.
- How many crownstones are in the crownstonesAtCreation list of the fingerprint(s)? If less than 3 total, set the quality to 10%, if ratio, set to ratio (mapped 0 .. 80%).
  - If mulitple trainingsets are used, the average of the quality scores will be used weighed by the number of datapoints. This will give a better average.

If the score (partially) falls below 60%, discard the trainingset upon the next training of the room. If the total quality is above 60%, add the new set to the previous ones.
TODO: DECIDE: If there are multiple sets for a location, automatically remove the worst one. 


If the user has moved a crownstone, ask him which and delete that one from the fingerprints. The problem then becomes an "adding new crownstones" one.

# Collecting data 

There are 3 ways to collect data.

### Initial training of the room.
This requires at least 120 datapoints of training, after which the user is allowed to gather more. This is automatically labelled as in-hand type training data.

After this, we offer the user to optionally collect in-pocket data. If the user wants to move on, he can do so. The user can always come back to train the in-pocket data later on.

### Quick-fix training
If you noticed a misclassification, you can use the quick-fix method if you were in the same room for the last 2 minutes. Assume the user pressed this at time T, we will place the 
samples we collected in the background from (T-10 .... t-40) into the training set. The last 10 seconds have been discarded because those are needed to navigate to the quickfix UI.

### Guided additional training
You can also use the guided training method. This will ask you to move to a certain location and then collect data. It will show you the top 4 locations and their probabilities. If you
select you want to improve the living room for instance, you walk around and see the living room, kitchen, hallway etc. with their probabilies of being selected at the given point. This way
you can search for weak points in the coverage and correct them.


# Plans from google doc
- [x] Move the training UI from rooms to spheres. Training, and improving the trainingsets is more relevant on sphere-level than on room level.
Example: if you want to ask a user why he retrains a room (in order to determine if you want to add to the existing dataset or replace it),
you can ask if he moved Crownstones around, added them etc. 
If you moved a Crownstone and want to retrain all rooms, it is annoying to go through this question menu all the time.
- [x] Improve training UI
- [x] Collect larger datasets
- [x] Do not stop after a min amount of datapoints but give control to the user on when to stop
- [x] Add feature to add to dataset
- [x] Have multiple types of datasets (in pocket, auto-collected, extended arm)
- [x] On removal of a Crownstone, remove it from the fingerprints
- [x] Add visualization for real-time optimization where you can see the expected rooms in a top 4 bar diagram, along with a coverage indicator.
- [x] Use KNN based on In-network Indoor Localization with:
d += 2 * (x*x + y*y - 1.95*x*y)
- [x] Use KNN in js instead of native.
- [x] Store existing crownstone IDs along with the training data to avoid penalties for crownstones existing in the test vector and not in the training data.
- [x] Use the https://reactnative.dev/docs/interactionmanager 

# Syncing fingerprints with the cloud

All raw fingerprints are stored in the cloud. Each user in the sphere will download the full set of raw fingerprints. If any user (admin/member) has marked a crownstone as moved,
the data from this Crownstone will be removed from the fingerprint. This will be synced back to the cloud and to the other users. If any user has removed a fingerprint manually or 
if the score of a fingerprint was low enough that it has been automatically removed, this will be synced back to the cloud and the fingeprint will be removed from the other users as well.