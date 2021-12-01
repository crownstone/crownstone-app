import {
  SELECTABLE_TYPE
} from "../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreBehaviourCore } from "./AicoreBehaviourCore";
import { Languages } from "../../../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTwilight", key)(a,b,c,d,e);
}

const EMPTY_BEHAVIOUR : twilight = {
  action:   { type: "DIM_WHEN_TURNED_ON", data: 60 },
  time:     { type:"RANGE", from: { type: "SUNSET", offsetMinutes:0}, to:{ type: "SUNRISE", offsetMinutes:0} },
};

export class AicoreTwilight extends AicoreBehaviourCore {
  originalBehaviour : twilight;
  behaviour : twilight;

  constructor(behaviour?: twilight | AicoreTwilight | string) {
    super();

    if (!behaviour) {
      this.behaviour = xUtil.deepExtend({},EMPTY_BEHAVIOUR);
    }
    else if (typeof behaviour === 'string') {
      this.fromString(behaviour);
    }
    else {
      if (!(behaviour instanceof AicoreTwilight)) {
        this.behaviour = behaviour;
      }
      else {
        this.behaviour = xUtil.deepExtend({}, behaviour.behaviour);
      }
    }
  }


  _getChunks(sphereId: string) {
    let intentionStr = lang("If_Im_turned_on");
    let timeStr   = AicoreUtil.extractTimeString(this.behaviour, true);
    if (timeStr) {
      timeStr += ',';
    }
    else {
      intentionStr += ',';
    }
    let actionStr = AicoreUtil.extractActionString(this.behaviour);

    return {
      intention:      { label: intentionStr,   data: null },
      time:           { label: timeStr,        data: this.behaviour.time },
      action:         { label: actionStr,      data: this.behaviour.action },
    }
  }


  getSentence(sphereId: string) {
    let chunks = this._getChunks(sphereId);

    let sentence = "";
    sentence += chunks.intention.label;
    sentence += chunks.time.label   ? " " + chunks.time.label   : "";
    sentence += chunks.action.label ? " " + chunks.action.label : "";
    sentence += ".";

    return sentence;
  }


  getSelectableChunkData(sphereId: string) : selectableAicoreBehaviourChunk[] {
    let chunks = this._getChunks(sphereId);

    let result : selectableAicoreBehaviourChunk[]= [];

    let addToResult = (chunk, type = null, hidden = false) => {
      if (typeof chunk === "string") {
        chunk = {label:chunk, changeAction: () => {}, data: null};
      }
      result.push({label: chunk.label, clickable: type !== null, type: type, data: chunk.data, hidden: hidden});
    };

    addToResult(chunks.intention);
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time,   SELECTABLE_TYPE.TIME,   true);    }
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    addToResult(".");
    return result;
  }


  ignorePresence() : AicoreTwilight { return this; }
  setPresenceIgnore() : AicoreTwilight { return this; }
  setPresenceSomebody() : AicoreTwilight { return this; }
  setPresenceNobody() : AicoreTwilight { return this; }
  setPresenceSomebodyInSphere() : AicoreTwilight { return this; }
  setPresenceNobodyInSphere() : AicoreTwilight { return this; }
  setPresenceInSphere() : AicoreTwilight { return this; }
  setPresenceInLocations(locationIds: number[]) { return this; }
  setPresenceSomebodyInLocations(locationIds: number[]) : AicoreTwilight { return this; }
  setPresenceNobodyInLocations(locationIds: number[]) : AicoreTwilight { return this; }
  setNoEndCondition() : AicoreTwilight { return this;  }
  setEndConditionWhilePeopleInSphere() : AicoreTwilight { return this;  }
  setEndConditionWhilePeopleInLocation(locationId) : AicoreTwilight { return this;  }

  doesActionMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    return xUtil.deepCompare(this.behaviour.action, otherAicoreTwilight.behaviour.action);
  }

  doesPresenceTypeMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceLocationMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesEndConditionMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesTimeMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    let match = xUtil.deepCompare(this.behaviour.time, otherAicoreTwilight.behaviour.time);
    return match;
  }

  getLocationUids() : number[] {
    return [];
  }

  isUsingPresence() : boolean {
    return false;
  }
  isUsingSingleRoomPresence() : boolean {
    return false;
  }
  isUsingMultiRoomPresence() : boolean {
    return false;
  }
  isUsingSpherePresence() : boolean {
    return false;
  }
  hasNoEndCondition(): boolean {
    return true;
  }
  hasLocationEndCondition(): boolean {
    return false;
  }
}