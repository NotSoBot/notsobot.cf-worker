// @ts-nocheck
// MessageChannel Polyfill for Cloudflare Workers
// This implementation provides MessageChannel and MessagePort functionality
// that works within the Cloudflare Workers runtime environment

// Only define polyfills if they don't exist
const _MessagePort = globalThis.MessagePort || class MessagePort extends EventTarget {
  constructor() {
    super();
    this._partner = null;
    this._started = false;
    this._messageQueue = [];
    this.onmessage = null;
    this.onmessageerror = null;
  }

  _setPartner(partner) {
    this._partner = partner;
  }

  start() {
    this._started = true;
    // Process any queued messages
    while (this._messageQueue.length > 0) {
      const message = this._messageQueue.shift();
      this._deliverMessage(message);
    }
  }

  close() {
    this._partner = null;
    this._started = false;
    this._messageQueue = [];
  }

  postMessage(data, transfer) {
    if (!this._partner) {
      throw new Error('MessagePort is not connected');
    }

    // Clone the data (simulate structured clone algorithm)
    let clonedData;
    try {
      clonedData = JSON.parse(JSON.stringify(data));
    } catch (e) {
      // Fallback for non-JSON serializable data
      clonedData = data;
    }

    const message = {
      data: clonedData,
      ports: transfer || [],
      source: this,
      target: this._partner
    };

    // Use setTimeout to make it asynchronous (simulate browser behavior)
    setTimeout(() => {
      this._partner._receiveMessage(message);
    }, 0);
  }

  _receiveMessage(message) {
    if (this._started) {
      this._deliverMessage(message);
    } else {
      this._messageQueue.push(message);
    }
  }

  _deliverMessage(message) {
    const event = new _MessageEvent('message', {
      data: message.data,
      ports: message.ports || [],
      source: message.source,
      target: message.target
    });

    // Call onmessage handler if it exists
    if (typeof this.onmessage === 'function') {
      try {
        this.onmessage(event);
      } catch (error) {
        this._dispatchError(error);
      }
    }

    // Dispatch the event for addEventListener listeners
    this.dispatchEvent(event);
  }

  _dispatchError(error) {
    const errorEvent = new _ErrorEvent('messageerror', {
      error: error,
      message: error.message,
      filename: '',
      lineno: 0,
      colno: 0
    });

    if (typeof this.onmessageerror === 'function') {
      this.onmessageerror(errorEvent);
    }

    this.dispatchEvent(errorEvent);
  }
}

const _MessageChannel = globalThis.MessageChannel || class MessageChannel {
  constructor() {
    this.port1 = new _MessagePort();
    this.port2 = new _MessagePort();

    // Connect the ports to each other
    this.port1._setPartner(this.port2);
    this.port2._setPartner(this.port1);

    // Ports are started by default in MessageChannel
    this.port1.start();
    this.port2.start();
  }
}

// Custom MessageEvent for the polyfill
const _MessageEvent = globalThis.MessageEvent || class MessageEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.data = eventInitDict.data;
    this.ports = eventInitDict.ports || [];
    this.source = eventInitDict.source || null;
    this.lastEventId = eventInitDict.lastEventId || '';
    this.origin = eventInitDict.origin || '';
  }
}

// Custom ErrorEvent for error handling
const _ErrorEvent = globalThis.ErrorEvent || class ErrorEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.message = eventInitDict.message || '';
    this.filename = eventInitDict.filename || '';
    this.lineno = eventInitDict.lineno || 0;
    this.colno = eventInitDict.colno || 0;
    this.error = eventInitDict.error || null;
  }
}

// Export for use in Cloudflare Workers
// Only polyfill if not already available
if (!globalThis.MessageChannel) {
  globalThis.MessageChannel = _MessageChannel;
  globalThis.MessagePort = _MessagePort;
  globalThis.MessageEvent = _MessageEvent;
}

// Export for module usage
export const MessageChannel = _MessageChannel;
export const MessagePort = _MessagePort;
export const MessageEvent = _MessageEvent;

// Also support CommonJS if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MessageChannel: _MessageChannel,
    MessagePort: _MessagePort,
    MessageEvent: _MessageEvent,
    ErrorEvent: _ErrorEvent
  };
}
