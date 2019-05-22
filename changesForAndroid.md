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