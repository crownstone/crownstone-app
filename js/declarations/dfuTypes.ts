interface dfuStatusUpdate {
  totalSteps: number,
  amountOfBootloaders: number,
  amountOfFirmwares:   number,
  phase: DFU_PHASE,
  currentStep: number,
  progress: number,
  info: DFU_INFO
}

type DFU_PHASE = "PREPERATION" | "BOOTLOADER" |   "FIRMWARE" |   "SETUP";
type DFU_INFO  = "GETTING_INFORMATION"    | "OBTAINED_INFORMATION_CLOUD" | "OBTAINED_VERSIONS_FROM_STONE" | "OBTAINED_STEPS" |
                 "DOWNLOAD_STARTED"       | "DOWNLOAD_SUCCESS"           | "DOWNLOAD_FAILED"              |
                 "UPDATE_PUT_IN_DFU_MODE" | "UPDATE_START"               | "UPDATE_PROGRESS"              | "UPDATE_SUCCESS" | "UPDATE_FAILED" |
                 "SETUP_START"            | "SETUP_PROGRESS"             | "SETUP_SUCCESS"                | "SETUP_FAILED"

