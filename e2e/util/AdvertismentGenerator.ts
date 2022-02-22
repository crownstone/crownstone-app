import fetch from 'node-fetch';

class AdvertisementGenerator {


  ibeaconArray() {
    // TODO: know how to get the iBeacon uuids
    // Can ask the trackedCommand?
  }

  normalAdvertisement(handle: string, sphereId: string) {
    let adv =  {
      handle              : handle,
      name                : "CRWN",
      rssi                : -60,
      referenceId         : sphereId, // The sphere ID. Only required when advertisement is validated and crownstone is in normal mode
      isInDFUMode         : false,
      serviceData: getServiceData()
    }
    return adv;
  }

  setupAdvertisement(handle: string, sphereId: string) {
    let adv =  {
      handle              : handle,
      name                : "CRWN",
      rssi                : -60,
      referenceId         : sphereId, // The sphere ID. Only required when advertisement is validated and crownstone is in normal mode
      isInDFUMode         : false,
      serviceData:  getServiceData({setupMode: true})
    }
    return adv;
  }
}

function getServiceData(overrides : any = {}) {
  return {
    opCode                    : 7, // unencrypted type (optional)
    dataType                  : 0, // encrypted type (optional)
    stateOfExternalCrownstone : false,
    alternativeState          : false,
    hasError                  : false,
    setupMode                 : false,
    hubMode                   : false,
    crownstoneId              : 0, // [0 .. 255]
    switchState               : 0, // [0 .. 228]
    flagsBitmask              : 0, // bitmask (optional)
    temperature               : 30, // °C
    powerFactor               : 1, // [-1.0 .. 1.0] __not 0__ (default 1.0)
    powerUsageReal            : 0, // W
    powerUsageApparent        : 0, // VA
    accumulatedEnergy         : 0, // J
    timestamp                 : Date.now(), // reconstructed timestamp, -1 if not available, uint16 counter when time is not set

    // bitmask flags
    dimmerReady               : true,
    dimmingAllowed            : false,
    switchLocked              : false,
    timeSet                   : false,
    switchCraftEnabled        : false,
    tapToToggleEnabled        : false,
    behaviourOverridden       : false,

    // alternative state items
    assetFiltersCRC           : 0,
    assetFiltersMasterVersion : 0,
    behaviourEnabled          : false,
    behaviourMasterHash       : 1,

    hubData                   : [],

    uartAlive                 : false,
    uartAliveEncrypted        : false,
    uartEncryptionRequiredByCrownstone : false,
    uartEncryptionRequiredByHub        : false,
    hubHasBeenSetup           : false,
    hubHasInternet            : false,
    hubHasError               : false,

    deviceType                : 'builtinOne',
    rssiOfExternalCrownstone  : 0, // Set to 0 when not external service data.
    errorMode                 : false, // True when service data is of type error.
    errors                    : {}, // Has to be correct when errorMode is true.
    uniqueElement             : Date.now()%65335, // Partial timestamp, counter, etc. Is this required?
    ...overrides
  }
}