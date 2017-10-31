module.exports = Server;

var debug = require('debug')('netrix:server');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dgram = require('dgram');
var constants = require('./constants');

function Server(config) {
  config = config || {};
  Object.defineProperty(this, 'flushInterval', {
    value: config.flushInterval || 1000
  });
  Object.defineProperty(this, 'port', {
    value: config.port || 49494
  });
  Object.defineProperty(this, '_data', {
    value: {}
  });
  this.reset();
}

util.inherits(Server, EventEmitter);

Server.prototype.start = start;
Server.prototype.stop = stop;
Server.prototype.reset = reset;

Server.prototype._flush = _flush;
Server.prototype._onMessage = _onMessage;
Server.prototype._aggregate = _aggregate;
Server.prototype._clear = _clear;

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

    _this._data.timestamp = Date.now();

    function onListeningError(err) {
      debug('started failed');
      clearInterval(_this.interval);
      reject(err);
    }

    function onListening() {
      _this.server.removeListener('error', onListeningError);
      debug('started ok');
      resolve();
    }

    _this.server = dgram.createSocket('udp4');
    _this.server.on('error', onListeningError);
    _this.server.on('listening', onListening);
    _this.server.on('message', _this._onMessage.bind(_this));
    _this.server.bind(_this.port);
  });
}

function stop() {
  debug('stop()');
  var _this = this;
  return new Promise(function (resolve, reject) {
    clearInterval(_this.interval);
    _this.server.on('close', resolve);
    _this.server.close();
    debug('stop ok');
  });
}

function reset() {
  this._data.raw = {
    c: {
      'netrix.bytes.received': [],
      'netrix.frames.received': [],
      'netrix.metrics.received': []
    }
  }
  this._data.counters = {};
  this._data.gauges = {};
}

function _flush() {
  debug('_flush');
  var now = Date.now();
  var metrics;

  this._data.gauges['netrix.flush.lag'] =
    now - this._data.timestamp - this.flushInterval;
  this._data.timestamp = now;
  this._aggregate();
  metrics = JSON.parse(JSON.stringify({
    counters: this._data.counters,
    gauges: this._data.gauges,
  }))
  this.emit('flush', now, metrics, this._data.raw);
  this._clear();
}

function _onMessage(data) {
  var records = data.toString().split('\n');
  var _this = this;
  var raw = this._data.raw;

  debug('received %d byte message with %d records', data.length, records.length);

  raw.c = raw.c || {};
  raw.c['netrix.bytes.received'] = raw.c['netrix.bytes.received'] || [];
  raw.c['netrix.bytes.received'].push(data.length);

  raw.c['netrix.frames.received'] = raw.c['netrix.frames.received'] || [];
  raw.c['netrix.frames.received'].push(1);

  raw.c['netrix.metrics.received'] = raw.c['netrix.metrics.received'] || [];
  raw.c['netrix.metrics.received'].push(records.length);

  records.forEach(function (record) {
    var typeOffset = record.indexOf('|');
    var valueOffset = record.indexOf(':');
    var type = record.substring(typeOffset + 1);
    var value = parseFloat(record.substring(valueOffset + 1, typeOffset));
    var name = record.substring(0, valueOffset);

    var data = _this._data.raw[type] = _this._data.raw[type] || {};
    data[name] = data[name] || [];
    data[name].push(value);
  });
}

function _aggregate() {
  debug('_aggregate()');
  var _this = this;
  Object.keys(constants.METRIC_TYPE).forEach(function (typeName) {
    var typeCode = constants.METRIC_TYPE[typeName];

    if (!_this._data.raw[typeCode]) return;

    Object.keys(_this._data.raw[typeCode]).forEach(function (metricName) {
      var dataArray = _this._data.raw[typeCode][metricName];
      var sum = dataArray.reduce(_add, 0);
      var newValue;

      switch (typeCode) {
        case 'c':
          newValue = sum * 1000 / _this.flushInterval;
          _this._data.counters[metricName] = newValue;
          debug('counter \'%s\' at %d/s', metricName, newValue);
          break;

        case 'g':
          newValue = (sum / dataArray.length) || _this._data.gauges[metricName];
          _this._data.gauges[metricName] = newValue;
          debug('gauge \'%s\' at %d', metricName, newValue);
          break;
      }
    });
  });
}

function _clear() {
  debug('_clear()');
  var _this = this;
  Object.keys(this._data.raw).forEach(function (metricType) {
    var metrics = _this._data.raw[metricType];
    Object.keys(metrics).forEach(function (metricName) {
      metrics[metricName].length = 0;
    });
  });
}

function _add(a, b) {
  return a + b;
}
