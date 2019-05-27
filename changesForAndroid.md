- create an android version of BleTroubleshooter.tsx

- added getTrackingState bridge method.
    ```
    return type in promise:

    interface trackingState {
      isMonitoring: boolean,
      isRanging:    boolean,
    }
    ```

Added bridge functions

setupPulse() --> returns void promise> Crownstone is already connected, then this call will handle the setup encryption, turn the relay on, wait 1 second, turn it off, disconnect & resolve


subscribeToNearest() --> starts the flow of nearestSetupCrownstone and nearestCrownstone events to the app, can be called multiple times safely.
unsubscribeNearest() --> stops the flow of nearestSetupCrownstone and nearestCrownstone events to the app, can be called multiple times safely.

subscribeToUnverified() --> starts the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events to the app
unsubscribeUnverified() --> stops the flow of crownstoneAdvertisementReceived and unverifiedAdvertisementData events