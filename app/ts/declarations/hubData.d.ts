
interface HubDataType {
  SETUP:         0,
  COMMAND:       1,
  FACTORY_RESET: 2,
  REQUEST_DATA:  10,
}

interface HubReplyError {
  NOT_IN_SETUP_MODE: 0,
  IN_SETUP_MODE:     1,
  INVALID_TOKEN:     2,
  UNKNOWN:           60000,
}

interface HubReplyCode {
  SUCCESS:    0,
  DATA_REPLY: 10,
  ERROR:      4000
}

interface HubRequestDataType {
  CLOUD_ID: 0
}

interface HubDevOptions {
  actOnSwitchCommands?: boolean
}
