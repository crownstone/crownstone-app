import { DEBUG } from '../ExternalConfig'


export class EventBus {
  constructor() {
    this.topics = {};
  }
  
  on(topic, callback) {
    if (this.topics[topic] === undefined)
      this.topics[topic] = [];

    // generate unique id
    let id = (1e5 + Math.random()*1e9).toString(36) + '-' + (1e5 + Math.random()*1e9).toString(36);

    this.topics[topic].push({id,callback});

    // return unsubscribe function.
    return () => {this.off(topic, id);};
  }

  emit(topic, data) {
    if (DEBUG) {
      //LOG("EMIT: ", topic, data);
    }

    if (this.topics[topic] !== undefined) {
      this.topics[topic].forEach((element) => {
        element.callback(data);
      })
    }
  }

  off(topic, id) {
    if (this.topics[topic] !== undefined) {
      // find id and delete
      for (let i = 0; i < this.topics[topic].length; i++) {
        if (this.topics[topic][i].id === id) {
          this.topics[topic].splice(i,1);
          break;
        }
      }

      if (Object.keys(this.topics[topic]).length === 0)
        delete this.topics[topic];
    }
  }
  
  
  
}

export let eventBus = new EventBus();