 
add bridge function: 

 broadcastBehaviourSettings:     (referenceId, enabled) => { return BluenetPromise('broadcastBehaviourSettings', referenceId, enabled)},
 
 which will broadcast this https://github.com/crownstone/bluenet/blob/master/docs/BROADCAST_PROTOCOL.md#behaviour-settings for 5 seconds.