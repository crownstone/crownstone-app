interface MeasurementMap {
  [crownstoneId: string]: rssi
}
type transformFactor = number; // around 1
type TransformData = [rssi, transformFactor];
type TransformArray = TransformData[];
interface BucketedData {
  x: number,
  data: TransformArray
};
interface AveragedBucketedData {
  x: number,
  data: TransformData
}
type TransformSet = AveragedBucketedData[];

type TransformResult = {sessionId: uuid, fromDevice: string, toDevice: string, transform: TransformSet}[]