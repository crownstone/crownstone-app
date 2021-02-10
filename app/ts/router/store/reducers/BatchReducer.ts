// from https://github.com/tshelburne/redux-batched-actions
// included due to conflict with newer RN version
export const BATCH = 'BATCHING_REDUCER.BATCH';

// modified for application
export function batchActions(context, actions) {
  return context.dispatch({ type: BATCH, payload: actions });
}

export function enableBatching(reducer) {
  return function batchingReducer(state, action) {
    switch (action.type) {
      case BATCH:
        return action.payload.reduce(batchingReducer, state); // uses Array.reduce.
      default:
        return reducer(state, action);
    }
  };
}



// ---------------
