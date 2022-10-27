import { LOGd, LOGe, LOGi} from "../logging/Log";
import { xUtil } from "./StandAloneUtil";


const EXCLUDE_FROM_CLEAR = {
  showLoading: true,
};

export class EventBusClass {
  _id: string;
  _topics : object;
  _topicIds : object;

  _count = 0
  _type : string;

  constructor(type: string) {
    this._type = "EventBus_" + type;
    this._id = xUtil.getUUID();
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

    this._topics[topic].push({id,callback});
    this._topicIds[id] = true;
    this._count += 1;
    LOGi.event(`Subscribed to topic[${topic}], topicCount:[${this._topics[topic].length}], totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);

    // return unsubscribe function.
    return () => {
      if (this._topics[topic] !== undefined) {
        // find id and delete
        for (let i = 0; i < this._topics[topic].length; i++) {
          if (this._topics[topic][i].id === id) {
            this._topics[topic].splice(i,1);
            this._count -= 1;
            LOGi.event(`Unsubscribed from topic[${topic}], topicCount:[${this._topics[topic].length}], totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);
            break;
          }
        }

        // clear the ID
        this._topicIds[id] = undefined;
        delete this._topicIds[id];

        if (this._topics[topic].length === 0) {
          delete this._topics[topic];
        }
      }
    };
  }

  emit(topic, data?) {
    if (this._topics[topic] !== undefined) {
      LOGd.event(topic, data);
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

  /**
   * Emit after a tick to get let the calling function finish first
   * @param topic
   * @param callback
   */
  emitAfterTick(topic, callback) {
    setTimeout(() => {
      this.emit(topic, callback);
    }, 0);
  }

  once(topic, callback) {
    let unsubscriber = this.on(topic, (data: any) => {
      unsubscriber();
      callback(data);
    });
    return unsubscriber;
  }


  clearAllEvents() {
    this._count = 0;
    LOGi.event(`EventBus: Clearing all event listeners type:[${this._type}] busId:[${this._id}]`);
    this._topics = {};
    this._topicIds = {};
  }


  /**
   * This will only be used at clearing the database.
   */
  clearMostEvents() {
    let topics = Object.keys(this._topics);
    let remainingTopics = {};
    this._count = 0;
    for (let i = 0; i < topics.length; i++) {
      if (EXCLUDE_FROM_CLEAR[topics[i]] !== true) {
        delete this._topics[topics[i]];
      }
      else {
        remainingTopics[topics[i]] = this._topics[topics[i]].length;
        this._count += this._topics[topics[i]].length
      }
    }

    for (let topic in remainingTopics) {
      LOGi.event(`EventBus: RemainingTopics topic[${topic}], topicCount:[${remainingTopics[topic].length}], totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);
    }


    LOGi.event(`EventBus: Clearing most event listeners. totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);

  }
}

export let eventBus : any = new EventBusClass("mainSingleton");
