import { NativeModules } from 'react-native';

let Bluenet = NativeModules.Bluenet;

export const BLUENET = function(functionName, param) {
  return new Promise((resolve, reject) => {
    Bluenet[functionName](param, (result) => {
      if (result.status === 'error') {
        reject(result.data);
      }
      else {
        resolve(result.data);
      }
    })
  })
};

