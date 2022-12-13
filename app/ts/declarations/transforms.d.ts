interface MeasurementMap {
  [crownstoneId: string]: rssi
}
type transformFactor = number; // around 1
type TransformDataVector = [rssi, transformFactor];
type TransformArray = TransformDataVector[];
interface BucketedData {
  x: number,
  data: TransformArray
};
interface AveragedBucketedData {
  x: number,
  data: TransformDataVector
}
type TransformSet = AveragedBucketedData[];

type TransformResult = {
  sessionId: uuid,
  fromDevice: string,
  fromUser: userId,
  toDevice: string,
  toUser: userId,
  transform: TransformSet
}[]

type TransformSessionState = "UNINITIALIZED"      |
  "AWAITING_SESSION_REGISTRATION"                 |
  "AWAITING_SESSION_START"                        |
  "AWAITING_INVITATION_ACCEPTANCE"                |
  "SESSION_WAITING_FOR_COLLECTION_INITIALIZATION" |
  "SESSION_WAITING_FOR_COLLECTION_START"          |
  "FINALIZING"                                    |
  "FINISHED"                                      |
  "COLLECTION_STARTED"                            |
  "WAITING_ON_OTHER_USER"                         |
  "WAITING_TO_FINISH_COLLECTION"                  |
  "COLLECTION_COMPLETED"                          |
  "FAILED"

type CollectionState = "UNINITIALIZED" |
  "CLOSER"                             |
  "FURTHER_AWAY"                       |
  "DIFFERENT"                          |
  "FINISHED"


interface TransformStats {
  close: number,
  mid:   number,
  far:   number,
  total: number
}