
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