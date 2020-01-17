Add a getBehaviourDebugInformation bridge method that return a promise with this data format:
interface behaviourDebug {
  time                : number
  sunrise             : number
  sunset              : number
  overrideState       : number
  behaviourState      : number
  aggregatedState     : number
  dimmerPowered       : number
  behaviourEnabled    : number
  activeBehaviours    : boolean[]
  activeEndConditions : boolean[]
  presenceProfile_0   : boolean[]
  presenceProfile_1   : boolean[]
  presenceProfile_2   : boolean[]
  presenceProfile_3   : boolean[]
  presenceProfile_4   : boolean[]
  presenceProfile_5   : boolean[]
  presenceProfile_6   : boolean[]
  presenceProfile_7   : boolean[]
  presenceProfile_8   : boolean[]
}

boolean[] is a bitmask representation (JS doenst like uint64)

so 000111 is [false, false, false, true, true, true]