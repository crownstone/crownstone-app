add bridge method vibrate(type: string);

this does not have to do anything, just be there. Android uses the RN vibration module.

add https://github.com/computerjazz/react-native-draggable-flatlist

remove bridge methods:
RCT_EXTERN_METHOD(startCollectingFingerprint)
RCT_EXTERN_METHOD(abortCollectingFingerprint)
RCT_EXTERN_METHOD(pauseCollectingFingerprint)
RCT_EXTERN_METHOD(resumeCollectingFingerprint)
RCT_EXTERN_METHOD(finalizeFingerprint:(NSString *)sphereId locationId:(NSString *)locationId callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearFingerprints)
RCT_EXTERN_METHOD(clearFingerprintsPromise:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(loadFingerprint:(NSString *)sphereId locationId:(NSString *)locationId fingerprint:(NSString *)fingerprint)

RCT_EXTERN_METHOD(startIndoorLocalization)
RCT_EXTERN_METHOD(stopIndoorLocalization)