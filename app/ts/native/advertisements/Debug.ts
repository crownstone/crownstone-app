
export function generateFakeAdvertisement(sphereId, stone) : crownstoneAdvertisement {

  let serviceData : crownstoneServiceData = {
    behaviourOverridden: false, tapToToggleEnabled: false,
    stateOfExternalCrownstone : false,
    hasError                  : false,
    hubMode                   : false,
    alternativeState          : false,
    setupMode                 : false,
    crownstoneId              : stone.config.uid,
    switchState               : 1,
    flagsBitmask              : 0,
    temperature               : 40,
    powerFactor               : 1,
    powerUsageReal            : Math.random()*300,
    powerUsageApparent        : Math.random()*300,
    accumulatedEnergy         : 0,
    timestamp                 : Date.now()/1000,

    // bitmask flags,
    dimmerReady               : true,
    dimmingAllowed            : true,
    switchLocked              : false,
    timeSet                   : true,
    switchCraftEnabled        : false,

    hubData                   : [],
    uartAlive                 : false,
    uartAliveEncrypted        : false,
    uartEncryptionRequiredByCrownstone : false,
    uartEncryptionRequiredByHub        : false,
    hubHasBeenSetup           : false,
    hubHasInternet            : false,
    hubHasError               : false,

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
    behaviourEnabled    : true,
    behaviourMasterHash : 0,
    uniqueElement       : Math.random()
  };

  return {
    handle              : stone.config.handle,
    name                : 'test',
    rssi                : -50 - Math.floor(Math.random()*50),
    referenceId         : sphereId,
    isInDFUMode         : false,
    serviceData         : serviceData
  }
}