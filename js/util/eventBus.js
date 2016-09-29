import { DEBUG } from '../ExternalConfig'
import { LOG, LOGError } from '../logging/Log'


export class EventBus {
  constructor() {
    this._topics = {};
  }
  
  on(topic, callback) {
    if (!(topic)) {
      LOGError("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOGError("Attempting to subscribe without callback to topic:", topic);
      return;
    }

    if (this._topics[topic] === undefined)
      this._topics[topic] = [];

    // generate unique id
    let id = (1e5 + Math.random()*1e9).toString(36) + '-' + (1e5 + Math.random()*1e9).toString(36);

    this._topics[topic].push({id,callback});

    // return unsubscribe function.
    return () => {
      if (this._topics[topic] !== undefined) {
        // find id and delete
        for (let i = 0; i < this._topics[topic].length; i++) {
          if (this._topics[topic][i].id === id) {
            this._topics[topic].splice(i,1);
            break;
          }
        }

        if (Object.keys(this._topics[topic]).length === 0)
          delete this._topics[topic];
      }
    };
  }

  emit(topic, data) {
    if (this._topics[topic] !== undefined) {
      this._topics[topic].forEach((element) => {
        element.callback(data);
      })
    }
  }
}

export let eventBus = new EventBus();
