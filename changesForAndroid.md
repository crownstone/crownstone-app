getCrownstoneUptime()                        : Promise<number>,
getAdcRestarts()                             : Promise<AdcRestart>,
getSwitchHistory()                           : Promise<SwitchHistory[]>,
getPowerSamples(triggeredSwitchcraft : bool) : Promise<PowerSamples[]>,

interface AdcRestart {
  restartCount: number,
  timestamp:    number,
}
interface SwitchHistory {
  timestamp:     number,
  switchCommand: number,
  switchState:   number,
  sourceData:    number,
  sourceId:      number,
  sourceType:    number,
  viaMesh:       boolean,
}
interface PowerSamples {
  type:           number,
  index:          number,
  count:          number,
  timestamp:      number,
  delay:          number,
  sampleInterval: number,
  offset:         number,
  multiplier:     number,
  samples:        number[],
}