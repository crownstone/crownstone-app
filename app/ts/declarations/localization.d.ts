
type vector = sigmoid[];
type fingerprintSummary = { id: processedFingerprintId, dataset: vector[]};

interface trainingData {
  dt: timestamp,
  data: Record<string, rssi>
}

interface trainingDataProcessed {
  dt: timestamp,
  data: Record<string, sigmoid>
}

type iBeaconHistory = [timestamp, ibeaconPackage[]];

interface ChosenClassificationSampleData {
  locationId: locationId,
  fingerprintId: fingerprintId,
  distance:number,
  index:number,
}

interface ClassificationData {
  closest: ChosenClassificationSampleData;
  distanceMap: Record<locationId, number>;
}
