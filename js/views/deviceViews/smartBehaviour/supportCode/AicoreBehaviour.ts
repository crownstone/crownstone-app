import {
  SELECTABLE_TYPE
} from "../../../../Enums";
import { AicoreUtil } from "./AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreBehaviourCore } from "./AicoreBehaviourCore";
import { Languages } from "../../../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreBehaviour", key)(a,b,c,d,e);
}

const EMPTY_RULE : behaviour = {
  action:   { type: "BE_ON", data: 100 },
  time:     { type: "ALL_DAY" },
  presence: { type: "IGNORE" },
};

export class AicoreBehaviour extends AicoreBehaviourCore {
  originalRule : behaviour;
  rule : behaviour;

  constructor(behaviour?: behaviour | AicoreBehaviour | string) {
    super();

    if (!behaviour) {
      this.rule = xUtil.deepExtend({},EMPTY_RULE);
    }
    else if (typeof behaviour === 'string') {
      this.fromString(behaviour)
    }
    else {
      if (!(behaviour instanceof AicoreBehaviour)) {
        this.rule = behaviour;
      }
      else {
        this.rule = xUtil.deepExtend({}, behaviour.rule);
      }
    }
  }


  _getChunks(sphereId: string) {
    let intentionStr = lang("I_will_be");
    let actionStr = AicoreUtil.extractActionString(this.rule);
    let { presencePrefix, presenceStr } = AicoreUtil.extractPresenceStrings(this.rule);
    let { locationPrefix, locationStr, locationPostfix } = AicoreUtil.extractLocationStrings(this.rule, sphereId);
    let timeStr = AicoreUtil.extractTimeString(this.rule);
    let { endConditionPrefix, endConditionStr } = AicoreUtil.extractEndConditionStrings(this.rule);


    return {
      intention:       { label: intentionStr,       data: null },
      action:          { label: actionStr,          data: this.rule.action },
      presencePrefix:  { label: presencePrefix,     data: null },
      presence:        { label: presenceStr,        data: this.rule.presence },
      locationPrefix:  { label: locationPrefix,     data: null },
      location:        { label: locationStr,        data: this.rule.presence },
      locationPostfix: { label: locationPostfix,    data: null },
      time:            { label: timeStr,            data: this.rule.time },
      optionPrefix:    { label: endConditionPrefix, data: null },
      option:          { label: endConditionStr,    data: this.rule.endCondition }
    }
  }


  getSentence(sphereId: string) {
    let chunks = this._getChunks(sphereId);

    let sentence = "";

    sentence += chunks.intention.label;
    sentence += chunks.action.label          ? " " + chunks.action.label          : "";
    sentence += chunks.presencePrefix.label  ? " " + chunks.presencePrefix.label  : "";
    sentence += chunks.presence.label        ? " " + chunks.presence.label        : "";
    sentence += chunks.locationPrefix.label  ? " " + chunks.locationPrefix.label  : "";
    sentence += chunks.location.label        ? " " + chunks.location.label        : "";
    sentence += chunks.locationPostfix.label ? " " + chunks.locationPostfix.label : "";
    sentence += chunks.time.label            ? " " + chunks.time.label            : "";
    sentence += ".";
    sentence += chunks.optionPrefix.label    ? " " + chunks.optionPrefix.label : "";
    sentence += chunks.option.label          ? " " + chunks.option.label + "." : "";

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
    if (chunks.action.label)          { addToResult(" "); addToResult(chunks.action,        SELECTABLE_TYPE.ACTION);   } else {  addToResult(chunks.action, SELECTABLE_TYPE.ACTION, true);    }
    if (chunks.presencePrefix.label)  { addToResult(" "); addToResult(chunks.presencePrefix);                          }
    if (chunks.presence.label)        { addToResult(" "); addToResult(chunks.presence,      SELECTABLE_TYPE.PRESENCE); } else {  addToResult(chunks.presence,SELECTABLE_TYPE.PRESENCE, true);  }
    if (chunks.locationPrefix.label)  { addToResult(" "); addToResult(chunks.locationPrefix);                          }
    if (chunks.location.label)        { addToResult(" "); addToResult(chunks.location,      SELECTABLE_TYPE.LOCATION); } else {  addToResult(chunks.location,SELECTABLE_TYPE.LOCATION, true);  }
    if (chunks.locationPostfix.label) { addToResult(" "); addToResult(chunks.locationPostfix);                         }
    if (chunks.time.label)            { addToResult(" "); addToResult(chunks.time,          SELECTABLE_TYPE.TIME);     } else {  addToResult(chunks.time, SELECTABLE_TYPE.TIME, true);      }
    addToResult(".");

    if (chunks.optionPrefix.label) {
      addToResult(" ");
      addToResult(chunks.optionPrefix);
    }
    else {
      addToResult(chunks.optionPrefix, undefined, true);
    }

    if (chunks.option.label) {
      addToResult(" ");
      addToResult(chunks.option, SELECTABLE_TYPE.OPTION);
      addToResult(".");
    }
    else {
      addToResult(chunks.option, undefined, true);
    }
    return result;
  }


  ignorePresence() : AicoreBehaviour {
    this.rule.presence = { type:"IGNORE" };
    return this;
  }
  setPresenceIgnore() : AicoreBehaviour {
    return this.ignorePresence();
  }
  setPresenceSomebody() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInSphere()
    }
    
    this.rule.presence.type = "SOMEBODY";
    return this;
  }
  setPresenceNobody() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceNobodyInSphere()
    }

    this.rule.presence.type = "NOBODY";
    return this;
  }
  setPresenceSomebodyInSphere() : AicoreBehaviour {
    this.rule.presence = { type:"SOMEBODY", data: {type:"SPHERE"}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceNobodyInSphere() : AicoreBehaviour {
    this.rule.presence = { type:"NOBODY", data: {type:"SPHERE"}, delay: this._getSphereDelay()};
    return this;
  }
  setPresenceInSphere() : AicoreBehaviour {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInSphere()
    }
    else {
      this.rule.presence.data.type = "SPHERE";
    }
    return this;
  }
  setPresenceInLocations(locationIds: number[]) {
    if (this.rule.presence.type === "IGNORE") {
      this.setPresenceSomebodyInLocations(locationIds);
    }
    else {
      this.rule.presence.data = { type: "LOCATION", locationIds: locationIds }
    }
    return this;
  }

  setPresenceSomebodyInLocations(locationIds: number[]) : AicoreBehaviour {
    this.rule.presence = { type:"SOMEBODY", data: {type:"LOCATION", locationIds: locationIds}, delay: this._getLocationDelay()};
    return this;
  }
  setPresenceNobodyInLocations(locationIds: number[]) : AicoreBehaviour {
    this.rule.presence = { type:"NOBODY", data: {type:"LOCATION", locationIds: locationIds}, delay: this._getLocationDelay()};
    return this;
  }

  setNoEndCondition() : AicoreBehaviour {
    delete this.rule.endCondition;
    return this;
  }
  setEndConditionWhilePeopleInSphere() : AicoreBehaviour {
    this.rule.endCondition = {type:"PRESENCE_AFTER", presence: {type: "SOMEBODY", data: { type: "SPHERE"}, delay: this._getSphereDelay()}};
    return this;
  }
  setEndConditionWhilePeopleInLocation(locationId: number) : AicoreBehaviour {
    this.rule.endCondition = {type:"PRESENCE_AFTER", presence: {type: "SOMEBODY", data: { type: "LOCATION", locationIds:[locationId]}, delay: this._getLocationDelay()}};
    return this;
  }

  doesActionMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return xUtil.deepCompare(this.rule.action, otherAicoreBehaviour.rule.action);
  }
  doesPresenceTypeMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return this.rule.presence.type === otherAicoreBehaviour.rule.presence.type;
  }
  doesPresenceLocationMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    if (this.rule.presence.type !== "IGNORE" && otherAicoreBehaviour.rule.presence.type !== "IGNORE") {
      return xUtil.deepCompare(this.rule.presence.data, otherAicoreBehaviour.rule.presence.data);
    }
    else {
      return this.doesPresenceTypeMatch(otherAicoreBehaviour);
    }
  }
  doesPresenceMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    return xUtil.deepCompare(this.rule.presence, otherAicoreBehaviour.rule.presence);
  }
  doesTimeMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    let match = xUtil.deepCompare(this.rule.time, otherAicoreBehaviour.rule.time);
    return match;
  }
  doesEndConditionMatch(otherAicoreBehaviour: AicoreBehaviour) : boolean {
    if (!this.rule.endCondition && !otherAicoreBehaviour.rule.endCondition) { return true; }
    if (!this.rule.endCondition &&  otherAicoreBehaviour.rule.endCondition) { return false; }
    if ( this.rule.endCondition && !otherAicoreBehaviour.rule.endCondition) { return false; }
    if (this.rule.endCondition.type !== otherAicoreBehaviour.rule.endCondition.type) { return false; }

    return this.rule.endCondition &&
      otherAicoreBehaviour.rule.endCondition &&
      xUtil.deepCompare(this.rule.endCondition, otherAicoreBehaviour.rule.endCondition);
  }


  getLocationUids() : number[] {
    if (this.rule.presence.type !== "IGNORE") {
      if (this.rule.presence.data.type === "LOCATION") {
        return this.rule.presence.data.locationIds;
      }
    }
    return [];
  }

  isUsingPresence() : boolean {
    return this.rule.presence.type !== "IGNORE";
  }
  isUsingSingleRoomPresence() : boolean {
    if (this.rule.presence.type !== "IGNORE") {
      if (this.rule.presence.data.type === "LOCATION") {
        return this.rule.presence.data.locationIds.length === 1;
      }
    }
    return false;
  }
  isUsingMultiRoomPresence() : boolean {
    if (this.rule.presence.type !== "IGNORE") {
      if (this.rule.presence.data.type === "LOCATION") {
        return this.rule.presence.data.locationIds.length > 1;
      }
    }
    return false;
  }
  isUsingSpherePresence() : boolean {
    if (this.rule.presence.type !== "IGNORE") {
      return this.rule.presence.data.type === "SPHERE";
    }
    return false;
  }
  hasNoEndCondition(): boolean {
    return !this.rule.endCondition;
  }
  hasLocationEndCondition(): boolean {
    if (this.rule.endCondition && this.rule.endCondition.presence && this.rule.endCondition.presence.data.type) {
      return this.rule.endCondition.presence.data.type === "LOCATION"
    }
    return false;
  }
}
