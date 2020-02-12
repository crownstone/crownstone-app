
Bridge functions:
canUseDynamicBackgroundBroadcasts which returns a boolean as a promise

registerTrackedDevice(
    trackingNumber:number,
    locationUid:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggle:boolean,
    deviceToken: number,
    ttlMinutes: number, 
    callback
)
which can throw error "ERR_ALREADY_EXISTS"


broadcastUpdateTrackedDevice(
    referenceId: string,
    trackingNumber:number,
    locationUid:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggle:boolean,
    deviceToken: number,
    ttlMinutes: number, 
    callback
)