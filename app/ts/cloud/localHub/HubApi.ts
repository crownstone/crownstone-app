import { HubApi, HubRequestHandler } from "./HubRequest";
import { Alert } from "react-native";


export const HUB_API = {

  enableDeveloperController: async function(hub: HubData, callback?) {
    return await handler(hub, '/enableDeveloperMode', callback)
  },

  disableDeveloperController: async function(hub: HubData) {
    return await handler(hub, '/disableDeveloperMode')
  },

  enableLoggingController: async function(hub: HubData) {
    return await handler(hub, '/enableLogging')
  },

  disableLoggingController: async function(hub: HubData) {
    return await handler(hub, '/disableLogging')
  },

  getDeveloperOptions: function(hub: HubData) {
    let api = new HubApi(hub);
    return api.get<any>('/developerOptions')
  },

  pushDeveloperOptions: function(hub: HubData, data) {
    let api = new HubApi(hub);
    return api.post<any>('/developerOptions',{body: data})
  },
}


async function handler(hub, endpoint, callback = () => {}) {
  let requestor = new HubRequestHandler(hub);
  try {
    let data = await requestor.get<string>(endpoint);
    if (data.indexOf("Unauthorized") !== -1) {
      throw new Error("UNAUTHORIZED")
    }
    return true;
  }
  catch (err : any) {
    if (err?.message === "REQUEST_TIMEOUT") {
      Alert.alert("Request timed out...","Are you on the same network?",[{text:"I'll check!", onPress:callback}], {cancelable: false})
    }
    else if (err?.message === "HUB_UNREACHABLE") {
      Alert.alert("Hub not reachable","Are you on the same network?",[{text:"I'll check!", onPress:callback}], {cancelable: false})
    }
    else if (err?.message === "UNAUTHORIZED") {
      Alert.alert("Not authorized","You must be an admin in the sphere to do this.",[{text:"Right...", onPress:callback}], {cancelable: false})
    }
    return false;
  }
}