const EventEmitter = require('events');

class Collector extends EventEmitter {
  constructor(communicator, fnEvent, filter, time) {
    super();
    this.communicator = communicator;
    this.fnEvent = fnEvent;
    this.filter = filter;
    this.time = time;

    this.handle = this.handle.bind(this);
    this.communicator.addListener(this.fnEvent, this.handle);
    if(this.time) this.timeout = setTimeout(() => this.stop("TIMEOUT"), this.time);
  };

  handle(...args) {
    if(this.filter && !this.filter(...args)) return;
    this.stop("SUCCESS", args)
  };

  stop(reason, args) {
    if(this.time) clearTimeout(this.timeout);
    this.communicator.removeListener(this.fnEvent, this.handle);
    this.emit("collect", reason, args);
  };
};

module.exports = Collector;
