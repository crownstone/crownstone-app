
import {BatchCommandHandler} from "../logic/BatchCommandHandler";
import {INTENTS} from "../native/libInterface/Constants";


export const StoneUtil = {
  switchBHC: function (sphereId, stoneId, stone, newState, store, finalize = (err) => {}) {
    let data = {state: newState};
    if (newState === 0) {
      data['currentUsage'] = 0;
    }

    BatchCommandHandler.loadPriority(
      stone,
      stoneId,
      sphereId,
      {commandName:'multiSwitch', state: newState, intent: INTENTS.manual, timeout: 0}
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
  }
}