type RtcMessageProtocol = RtcMessage | RtcReport | RtcFileTransfer
type LocalizationFileType = "localizationFile"
type LocalizationFileType = "genericFile"

interface RtcMessage {
  type: 'message',
  data: string
}


type reportCode = "TERMINATION_REASON_INVALID_MESSAGE" |
                  "RECEIVED"                           |
                  "RECEIVED_FINISHED"                  |
                  "RECEIVED_INVALID"                   |
                  "PART_TIMEOUT"                       |
                  "TRANSFER_ABORTED_TIMEOUT"


interface RtcReport {
  type: 'report',
  code: reportCode
  data: string
}
type encodingType = 'utf8' | 'ascii' | 'base64';
interface RtcFileTransfer {
  type: "fileTransfer"
  transferId: string,
  totalLength: number,
  fileName: string,
  encoding?: encodingType,
  part: number,
  data: string,
  metadata: LocalizationFileMetaData
}

interface LocalizationFileMetaData {
  type: LocalizationFileType,
  user: string
}

interface RtcLocalizationFileTransfer extends RtcFileTransfer {
  metadata: LocalizationFileMetaData
}