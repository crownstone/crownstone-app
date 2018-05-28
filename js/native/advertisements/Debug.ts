
export function generateFakeAdvertisement(sphereId, stone) : crownstoneAdvertisement {

  let serviceData : crownstoneServiceData = {
    stateOfExternalCrownstone : false,
    hasError                  : false,
    setupMode                 : false,
    crownstoneId              : stone.config.crownstoneId,
    switchState               : 1,
    flagsBitmask              : 0,
    temperature               : 40,
    powerFactor               : 1,
    powerUsageReal            : Math.random()*300,
    powerUsageApparent        : Math.random()*300,
    accumulatedEnergy         : 0,
    timestamp                 : new Date().valueOf()/1000,

    // bitmask flags,
    dimmingAvailable          : true,
    dimmingAllowed            : true,
    switchLocked              : false,
    timeSet                   : true,
    switchCraftEnabled        : false,

    deviceType                : 'plug',
    rssiOfExternalCrownstone  : -50,
    errorMode                 : false,
    errors                    : {
      overCurrent       : false,
      overCurrentDimmer : false,
      temperatureChip   : false,
      temperatureDimmer : false,
      dimmerOnFailure   : false,
      dimmerOffFailure  : false,
      bitMask           : 0,
    },
    uniqueElement             : Math.random(),
  }

  return {
    handle              : stone.config.handle,
    name                : 'test',
    rssi                : -50 - Math.random()*50,
    referenceId         : sphereId,
    isCrownstoneFamily  : true,
    isInDFUMode         : false,
    serviceUUID         : 'c001',
    serviceData         : serviceData
  }
}