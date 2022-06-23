# Localization V2

In V2, we will run an optimized KNN based classifier in JS instead of native ones.

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

    interface FingerprintData {
        id: string,
        cloudId: string | null,
        type: FingerprintType,
        createdAt: timestamp,
        crownstonesAtCreation: identifier[], // maj_min as id representing the Crownstone.
        data: {
            dt: number, // ms diff from createdAt
            data: Record<identifier, number>[]
        }

the ```identifier``` is the ``` ${iBeacon Major}_${iBeacon Minor} ``` of the Crownstone. This uniquely identifies the Crownstone 
without a localId, cloudId or CrownstoneId. The CrownstoneId can be reused, while the major and minor are random.

the ```FingerprintType``` is on of the following:

- 'initial'
- 'addition'

Processing a fingerprint is mandatory and will be done on the phone. The processed data is not stored on the cloud.

    interface FingerprintData {
        id: string,
        fingerprintId: string, // processed based on parent id
        type: FingerprintType,
        transformed: boolean,
        createdAt: timestamp,
        crownstonesAtCreation: identifier[], // maj_min as id representing the Crownstone.
        data: {
        dt: number, // ms diff from createdAt
        data: Record<identifier, number>[]
    }
