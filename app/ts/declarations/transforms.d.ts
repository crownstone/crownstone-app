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

type TransformSessionState = "UNINITIALIZED"     |
  "AWAITING_SESSION_REGISTRATION"                |
  "AWAITING_INVITATION_ACCEPTANCE"               |
  "SESSION_WAITING_FOR_COLLETION_INITIALIZATION" |
  "FINISHED"                                     |
  "READY_FOR_COLLECTION"                         |
  "WAITING_ON_OTHER_USER"                        |
  "WAITING_TO_FINISH_COLLECTION"                 |
  "WAITING_FOR_QUALITY_CHECK"                    |
  "FAILED"

