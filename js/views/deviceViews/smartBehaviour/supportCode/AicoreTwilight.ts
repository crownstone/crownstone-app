import {
  SELECTABLE_TYPE
} from "../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreBehaviourCore } from "./AicoreBehaviourCore";

const EMPTY_RULE : twilight = {
  action:   { type: "DIM_WHEN_TURNED_ON", data: 0.6 },
  time:     { type:"RANGE", from: { type: "SUNSET", offsetMinutes:0}, to:{ type: "SUNRISE", offsetMinutes:0} },
};

export class AicoreTwilight extends AicoreBehaviourCore {
  originalRule : twilight;
  rule : twilight;

  constructor(behaviour?: twilight | AicoreTwilight | string) {
    super();

    if (!behaviour) {
      this.rule = xUtil.deepExtend({},EMPTY_RULE);
    }
    else if (typeof behaviour === 'string') {
      this.fromString(behaviour);
    }
    else {
      if (!(behaviour instanceof AicoreTwilight)) {
        this.rule = behaviour;
      }
      else {
        this.rule = xUtil.deepExtend({}, behaviour.rule);
      }
    }
  }


  _getChunks() {
    let intentionStr = "If I'm turned on";
    let timeStr   = AicoreUtil.extractTimeString(this.rule, true) + ',';
    let actionStr = AicoreUtil.extractActionString(this.rule);

    return {
      intention:      { label: intentionStr,   data: null },
      action:         { label: actionStr,      data: this.rule.action },
      time:           { label: timeStr,        data: this.rule.time },
    }
  }


  getSentence() {
    let chunks = this._getChunks();

    let sentence = "";
    sentence += chunks.intention.label;
    sentence += chunks.time.label   ? " " + chunks.time.label   : ",";
    sentence += chunks.action.label ? " " + chunks.action.label : "";
    sentence += ".";

    return sentence;
  }


  getSelectableChunkData() : selectableAicoreBehaviourChunk[] {
    let chunks = this._getChunks();

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
    return xUtil.deepCompare(this.rule.action, otherAicoreTwilight.rule.action);
  }

  doesPresenceTypeMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceLocationMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesPresenceMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesEndConditionMatch(otherAicoreTwilight: AicoreTwilight) : boolean { return false; }
  doesTimeMatch(otherAicoreTwilight: AicoreTwilight) : boolean {
    let match = xUtil.deepCompare(this.rule.time, otherAicoreTwilight.rule.time);
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
}