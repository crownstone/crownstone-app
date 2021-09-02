import { HubApi, HubRequestHandler } from "./HubRequest";


export const HUB_API = {

  enableDeveloperController: async function(hub: HubData) {
    let requestor = new HubRequestHandler(hub);
    return requestor.get('/enableDeveloperMode')
  },

  disableDeveloperControllers: async function(hub: HubData) {
    let requestor = new HubRequestHandler(hub);
    return requestor.get('/disableDeveloperMode')
  },

  enableLoggingControllers: async function(hub: HubData) {
    let requestor = new HubRequestHandler(hub);
    return requestor.get('/enableLogging')
  },

  disableLoggingControllers: async function(hub: HubData) {
    let requestor = new HubRequestHandler(hub);
    return requestor.get('/disableLogging')
  },

  // getDeveloperOptions: function(hub: HubData) {
  //   let api = new HubApi(hub);
  //   return api.get
  // }
}
