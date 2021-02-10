import { LOG, LOGd, LOGe, LOGi, LOGv } from "../logging/Log";
import { xUtil } from "./StandAloneUtil";


const EXCLUDE_FROM_CLEAR = {
  showLoading: true,
};

export class EventBusClass {
  _topics : object;
  _topicIds : object;

  constructor() {
    this._topics = {};
    this._topicIds = {};
  }
  
  on(topic, callback) {
    if (!(topic)) {
      LOGe.event('Attempting to subscribe to undefined topic:', topic);
      return;
    }
    if (!(callback)) {
      LOGe.event('Attempting to subscribe without callback to topic:', topic);
      return;
    }

    if (this._topics[topic] === undefined) {
      this._topics[topic] = [];
    }

    // generate unique id
    let id = xUtil.getUUID();

    LOGv.event('Something is subscribing to ', topic, 'got ID:', id);

    this._topics[topic].push({id,callback});
    this._topicIds[id] = true;

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

        // clear the ID
        this._topicIds[id] = undefined;
        delete this._topicIds[id];

        if (this._topics[topic].length === 0) {
          delete this._topics[topic];
        }

        LOGv.event('Something with ID ', id ,' unsubscribed from ', topic);
      }
    };
  }

  emit(topic, data?) {
    if (this._topics[topic] !== undefined) {
      LOGi.event(topic, data);
      // Firing these elements can lead to a removal of a point in this._topics.
      // To ensure we do not cause a shift by deletion (thus skipping a callback) we first put them in a separate Array
      let fireElements = [];

      for (let i = 0; i < this._topics[topic].length; i++) {
        fireElements.push(this._topics[topic][i]);
      }

      for (let i = 0; i < fireElements.length; i++) {
        // this check makes sure that if a callback has been deleted, we do not fire it.
        if (this._topicIds[fireElements[i].id] === true) {
          fireElements[i].callback(data);
        }
      }
    }
  }

  once(topic, callback) {
    let unsubscriber = this.on(topic, (data: any) => {
      unsubscriber();
      callback(data);
    });
  }


  clearAllEvents() {
    LOGd.info("EventBus: Clearing all event listeners.");
    this._topics = {};
    this._topicIds = {};
  }


  /**
   * This will only be used at clearing the database.
   */
  clearMostEvents() {
    LOGd.info("EventBus: Clearing most event listeners.");
    let topics = Object.keys(this._topics);
    for (let i = 0; i < topics.length; i++) {
      if (EXCLUDE_FROM_CLEAR[topics[i]] !== true) {
        delete this._topics[topics[i]];
      }
    }
  }
}

export let eventBus : any = new EventBusClass();
