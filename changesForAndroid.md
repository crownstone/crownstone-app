- nearestStone has added dfuMode and verified.
    ```
    interface nearestStone  {
      name      : string,
      handle    : string,
      rssi      : number,
      setupMode : boolean
      dfuMode   : boolean
      verified  : boolean
    }
    ```

- ensure Bluenet.startScanning and Bluenet.startScanningForCrownstonesUniqueOnly can be called sequentially, multiple times.

- create an android version of BleTroubleshooter.tsx

- double check the nearestCrownstone and nearestSetupCrownstone events. Nearest is not verified only!

- added unverifiedAdvertisementData event

- added anyAdvertisementData event (all ble scans)

- added getTrackingState bridge method.
    ```
    return type in promise:

    interface trackingState {
      isMonitoring: boolean,
      isRanging:    boolean,
    }
    ```

- added isDevelopmentEnvironment method to bridge. Does not receive arguments other than a callback. Returns true or false. Important for iOS but nice to have for Android.


Added bridge functions
- setLocationState
- setDevicePreferences
- clearKeySets
- startAdvertising
- stopAdvertising
- isPeripheralReady