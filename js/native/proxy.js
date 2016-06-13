import { NativeModules, NativeAppEventEmitter } from 'react-native';

// var subscription = NativeAppEventEmitter.addListener(
//   'EventReminder',
//   (reminder) => console.log(reminder.name)
// );
//
// // Don't forget to unsubscribe, typically in componentWillUnmount
// subscription.remove();

export const Bluenet = NativeModules.BluenetJS;

export const BluenetPromise = function(functionName, param) {
  return new Promise((resolve, reject) => {
    Bluenet[functionName](param, (result) => {
      if (result.error === true) {
        reject(result.data);
      }
      else {
        resolve(result.data);
      }
    })
  })
};
