import Peer from 'react-native-peerjs';
import { core } from "../Core";
import { xUtil } from "../util/StandAloneUtil";
import { FileUtil } from "../util/FileUtil";
import { Scheduler } from "./Scheduler";
import { EventBusClass } from "../util/EventBus";
const RNFS = require('react-native-fs');

export class WebRtcClientClass {

  peer : Peer | null;
  connection;
  peerId : string = null;


  connectionToken : string;

  started   = false;
  connected = false;

  rctEventBus : EventBusClass;
  clearConnectionTimeout = () => {}
  clearOpenTimeout = () => {}

  constructor() {
    this.rctEventBus = new EventBusClass("RTCeventBus")
  }

  destroy() {
    if (this.peer) {
      this.peer.disconnect();
      this.peer.destroy();
    }

    this.started = false;
    this.connected = false;
    this.peer = null;
    this.peerId = null;

    this.rctEventBus.clearAllEvents();
    this.clearConnectionTimeout();
    this.clearConnectionTimeout = () => {};
    this.clearOpenTimeout();
    this.clearOpenTimeout = () => {};
  }

  refreshConnectionToken() {
    let state = core.store.getState();
    this.connectionToken = state.development.debugRTCtoken;
  }

  async initialize() {
    return new Promise<void>((resolve, reject) => {
      this.peer = new Peer();
      let handled = false;


      this.peer.on('error', (err) => {
        this.destroy();
        handled = true;
        reject(new Error(err));
      });


      this.peer.on('open', (peerId) => {
        this.peerId = peerId;
        this.started = true;
        handled = true;

        this.clearOpenTimeout();
        this.clearOpenTimeout = () => {};
        resolve();
      });

      // close should be done after error or open.
      this.peer.on('close', () => {
        this.destroy();
        if (handled === false) {
          reject(new Error("PEER_HAS_CLOSED"));
        }
        handled = true;
      });

      this.clearOpenTimeout = Scheduler.setTimeout(() => {
        // if the peer has not opened...
        this.destroy();
        if (this.started === false) {
          if (!handled) {
            reject(new Error("CANNOT_OPEN_PEER"));
            handled = true;
          }
        }

        if (handled === false) {
          reject(new Error("PEER_TIMEOUT"));
        }

      }, 1000);
    })
  }

  async connect() {
    this.refreshConnectionToken();

    if (!this.connectionToken) {
      this.destroy()
      throw new Error("NO_TOKEN");
    }
    if (!this.started) {
      await this.initialize();
    }

    await this._connect();
  }

  async _connect() {
    return new Promise<void>((resolve, reject) => {
      this.connection = this.peer.connect(this.connectionToken);

      this.clearConnectionTimeout = Scheduler.setTimeout(() => {
        if (this.connected === false) {
           reject(new Error("CANNOT_CONNECT"));
           this.destroy();
        }
      }, 1000);

      this.connection.on('close', (err) => {
        console.log("closing connection")
        this.destroy()
      });

      this.connection.on('error', (err) => {
        console.log("RTC Error:", JSON.stringify(err))
      });

      this.connection.on('open', () => {
        this.clearConnectionTimeout();
        this.clearConnectionTimeout = () => {};
        this.connected = true
        console.log('Remote peer has opened connection.');
        this.connection.on('data', (data) => {
          this._handleIncomingData(data);
        });
        resolve();
      });
    })
  }

  _handleIncomingData(data: string | object) {
    console.log("IncomingData", data);
    this.rctEventBus.emit("ReceivedData", data);
  }

  async sendLocalizationFile(path, progressCallback? : (progress) => void) {
    let sender = new FileSender(path, this.rctEventBus, this.sendMessage.bind(this), progressCallback);
    return sender.send();
  }

  sendMessage(message: RtcMessageProtocol) {
    this.connection.send(message);
  }
}

class FileSender {

  path : string;
  unsubscribe = () => {}

  basePayload: RtcFileTransfer;
  transferId : string;

  blob : string;

  maxChunkSize = 150e3;
  sentSize = 0;
  successfulSentSize = 0;
  part = 0;
  sendMessage : (data: RtcMessageProtocol) => void;

  progressCallback : (progress) =>  void = () => {}

  finished = false;

  resolve;
  reject;

  constructor(
    path:              string,
    rtcEventBus:       EventBusClass,
    sendMessage :      (data: RtcMessageProtocol) => void,
    progressCallback : (progress) => void = () => {}
  ) {
    this.path = path;
    this.sendMessage = sendMessage;
    this.progressCallback = progressCallback;
    this.unsubscribe = rtcEventBus.on('ReceivedData', (data) => { this._handleIncomingData(data); })
    this.transferId = xUtil.getUUID();

    let filePath = FileUtil.getPath();
    let name = this.path.split(filePath)[1];
    let state = core.store.getState();
    let userName = `${state.user.firstName} ${state.user.lastName}`

    this.basePayload = {
      type: "fileTransfer",
      transferId: this.transferId,
      totalLength: 0,
      fileName: name,
      encoding: 'utf8',
      part: 0,
      data: '',
      metadata: {
        type: 'localizationFile',
        user: userName,
      }
    }
  }

  cleanup() {
    this.unsubscribe();
  }

  _handleIncomingData(data: RtcMessageProtocol) {
    if (!data?.type) { return }

    if (data?.type === 'report') {
      switch (data.code) {
        case "RECEIVED":
          // next part
          this.successfulSentSize = this.sentSize;
          this.part += 1;
          this._sendChunk();
          break;
        case "RECEIVED_FINISHED":
          this.success();
          break;
        case "RECEIVED_INVALID":
          this.fail(new Error("RECEIVED_INVALID"))
          break;
        case "PART_TIMEOUT":
          // retry part
          this._sendChunk()
          break;
        case "TRANSFER_ABORTED_TIMEOUT":
          this.fail(new Error("TRANSFER_ABORTED_TIMEOUT"))
          break;
      }
    }
  }

  async _prepare() {
    let encoding = 'utf8' as encodingType;
    this.blob = await RNFS.readFile(this.path, encoding);

    this.basePayload.totalLength = this.blob.length;
    this.basePayload.encoding    = encoding;
  }

  async _sendChunk() {
    let chunk = this.blob.substr(this.successfulSentSize, this.maxChunkSize);
    this.sentSize = this.successfulSentSize + chunk.length;
    this.basePayload.data = chunk;
    this.basePayload.part = this.part;
    this.sendMessage(this.basePayload)
    this.progressCallback(this.sentSize/this.basePayload.totalLength)
  }

  async send() {
    return new Promise(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject  = reject;
      await this._prepare()
      await this._sendChunk();
    })
  }

  success() {
    if (!this.finished) {
      this.progressCallback(1)
      this.finished = true;
      this.cleanup();
      this.resolve();
    }
  }

  fail(err) {
    if (!this.finished) {
      this.finished = true;
      this.cleanup();
      this.reject(err);
    }
  }
}


export const WebRtcClient = new WebRtcClientClass()