
import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";


export const StoneUtil = {
  switchBHC: function (
      sphereId : string,
      stoneId : string,
      stone : any,
      newState : number,
      store : any,
      options = {},
      finalize = (err) => {},
      intent = INTENTS.manual,
      attempts : number = 1,
      label : string = 'from StoneUtil'
    ) {
    let data = {state: newState};
    if (newState === 0) {
      data['currentUsage'] = 0;
    }

    BatchCommandHandler.loadPriority(
      stone,
      stoneId,
      sphereId,
      {commandName:'multiSwitch', state: newState, intent: intent, timeout: 0},
      {},
      attempts,
      label
    )
      .then(() => {
        store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE',
          sphereId: sphereId,
          stoneId: stoneId,
          data: data
        });
        finalize(null);
      })
      .catch((err) => {
        finalize(err);
      });

    BatchCommandHandler.executePriority();
  },


  crownstoneTimeToTimestamp: function(csTimestamp) : number {
    let now = new Date().valueOf();
    if ((now / csTimestamp) < 10) {
      csTimestamp = csTimestamp / 1000;
    }
    let jsTimestamp = 1000*csTimestamp;
    let timezoneOffsetMinutes = new Date(jsTimestamp).getTimezoneOffset();

    return jsTimestamp + timezoneOffsetMinutes*60000;
  },

  timestampToCrownstoneTime: function(utcTimestamp) : number {
    // for holland in summer, timezoneOffsetMinutes is -120, winter will be -60
    let timezoneOffsetMinutes = new Date(utcTimestamp).getTimezoneOffset();

    return (utcTimestamp - timezoneOffsetMinutes*60000)/1000;
  },

  nowToCrownstoneTime: function() : number {
    return StoneUtil.timestampToCrownstoneTime(new Date().valueOf())
  },

};