var expect = require('expect.js');
var Server = require('../').Server;
var Client = require('../').Client;

describe('intergation', function () {

  beforeEach('reset metrics', function () {
    this.metrics = [];
  });

  beforeEach('start server', function () {
    var _this = this;
    this.server = new Server({
      port: 49494,
      flushInterval: 200
    });
    this.server.on('flush', function (metrics) {
      _this.metrics.push(metrics);
    });
    return this.server.start();
  });

  beforeEach('start client', function () {
    this.client = new Client({
      host: 'localhost',
      port: 49494,
      flushInterval: 50,
      maxDatagram: 1024
    });
    return this.client.start();
  });

  afterEach('stop client', function () {
    return this.client.stop();
  });

  afterEach('stop server', function () {
    return this.server.stop();
  });

  it('emits collected and aggregated counter metrics', function (done) {
    var _this = this;

    setTimeout(function () {
      // scaled up to per second from per 200ms
      expect(_this.metrics[0].counters).to.eql({'counter.name': 5});
      expect(_this.metrics[1].counters).to.eql({'counter.name': 0});
      expect(_this.metrics[2].counters).to.eql({'counter.name': 15});

      done();
    }, 700); // encapsulates 3 x 200ms (flushInterval)

    setTimeout(function () {
      _this.client.increment('counter.name');
    }, 100); // into first report (flush)

    setTimeout(function () {
      _this.client.increment('counter.name');
      _this.client.increment('counter.name');
      _this.client.increment('counter.name');
    }, 450); // into 3rd report (flush)
  });

  it.only('emits collected and aggregated gauge metrics', function (done) {
    var _this = this;

    setTimeout(function () {
      console.log(_this.metrics);

      done();
    });

    setTimeout(function () {
      _this.client.gauge('gauge.name');
    }, 100); // into first report (flush)

    setTimeout(function () {
      _this.client.gauge('gauge.name');
      _this.client.gauge('gauge.name');
      _this.client.gauge('gauge.name');
    }, 450); // into 3rd report (flush)
  });

  xit('counts metrics and messages');
  xit('gauges flush lag');

  xit('can reset metrics', function (done) {

  });


});
