// import {getTime, refreshDefaults, update} from "./reducerUtil";
//
//
// let defaultSettings = {
//   cloudId:   null,
//   property:  null,
//   value:     null,
//   updatedAt: 0
// };
//
//
// // PreferenceReducer
// let preferenceReducer = (state = defaultSettings, action : any = {}) => {
//   switch (action.type) {
//     case "UPDATE_PREFERENCE_CLOUD_ID":
//       if (action.data) {
//         let newState = {...state};
//         newState.cloudId = update(action.data.cloudId, newState.cloudId);
//         return newState;
//       }
//       return state;
//     case 'ADD_PREFERENCE':
//     case 'UPDATE_PREFERENCE':
//       if (action.data) {
//         let newState = {...state};
//         newState.property = update(action.data.property, newState.property);
//         newState.value    = update(action.data.value,    newState.value);
//
//         newState.updatedAt = getTime(action.data.timestamp || action.updatedAt);
//         return newState;
//       }
//       return state;
//     case 'REFRESH_DEFAULTS':
//       return refreshDefaults(state, defaultSettings);
//     default:
//       return state;
//   }
// };
//
//
// // preferenceReducer
// export default (state = {}, action : any = {}) => {
//   switch (action.type) {
//     case 'REMOVE_PREFERENCE':
//       let stateCopy = {...state};
//       delete stateCopy[action.preferenceId];
//       return stateCopy;
//     default:
//       if (action.preferenceId !== undefined) {
//         if (state[action.preferenceId] !== undefined || action.preferenceId === "ADD_PREFERENCE") {
//           return {
//             ...state,
//             ...{[action.preferenceId]: preferenceReducer(state[action.preferenceId], action)}
//           };
//         }
//       }
//       return state;
//   }
// };
//
//
//
