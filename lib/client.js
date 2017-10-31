module.exports = Client

var debug = require('debug')('netrix:client');
var dgram = require('dgram');

function Client(config) {
  config = config || {};
  Object.defineProperty(this, 'host', {
    value: config.host || 'localhost'
  });
  Object.defineProperty(this, 'port', {
    value: config.port || 49494
  });
  Object.defineProperty(this, 'flushInterval', {
    value: config.flushInterval || 50
  });
  Object.defineProperty(this, 'maxDatagram', {
    // maxDatagram: 65507,
    // makes things slow and data starts disapearing in node 8
    value: config.maxDatagram || 1024
  });
  Object.defineProperty(this, '_data', {
    value: []
  });
}


Client.prototype.start = start;
Client.prototype.stop = stop;
Client.prototype.increment = increment;
Client.prototype.gauge = gauge;

Client.prototype._flush = _flush;
Client.prototype._generateBuffers = _generateBuffers;

function start() {
  debug('start()');
  var _this = this;
  return new Promise(function (resolve, reject) {
    Object.defineProperty(_this, '_bindFlush', {
      value: _this._flush.bind(_this)
    });
    Object.defineProperty(_this, 'interval', {
      value: setInterval(_this._bindFlush, _this.flushInterval)
    });
    _this.socket = dgram.createSocket('udp4');
    resolve();
  });
}

function stop() {
  debug('stop()');
  var _this = this;
  return new Promise(function (resolve, reject) {
    clearInterval(_this.interval);
    _this.socket.close();
    resolve();
  });
}

function metric(metricName, value, customTypeCode) {
  var metricData = metricName + ':' + value + '|' + customTypeCode
  this._data.push(metricData);
}

function increment(metricName, value) {
  var metricData = metricName + ':' + (value || 1) + '|c';
  this._data.push(metricData);
}

function gauge(metricName, value) {
  var metricData = metricName + ':' + (value || 1) + '|g';
  this._data.push(metricData);
}

function _flush() {
  debug('_flush()');
  var accumulated = this._data.splice(0, this._data.length);
  if (accumulated.length == 0) {
    debug('no data to send');
    return;
  }
  var buffers = this._generateBuffers(accumulated);
  debug('writing %d metrics in %d buffers', accumulated.length, buffers.length);
  for (var i = 0; i < buffers.length; i++) {
    this.socket.send(buffers[i], /*0, buffers[i].length,*/ this.port, this.host);
  }
}

function _generateBuffers(dataArray) {
  var payload = [dataArray.join('\n')];

  while (payload[payload.length - 1].length > this.maxDatagram) {
    var offset = this.maxDatagram;
    var buffer = payload[payload.length - 1];
    var nextBuffer;

    while (buffer[--offset] != '\n');

    nextBuffer = buffer.substring(offset + 1);
    buffer = buffer.substring(0, offset + 1);
    payload[payload.length - 1] = buffer;
    payload.push(nextBuffer);
  }

  return payload;
}
