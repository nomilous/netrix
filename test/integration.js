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

  xit('emits collected and aggregated counter metrics', function (done) {
    var _this = this;

    var interval = setInterval(function () {
      _this.client.increment('counter.name');
    }, 1);

    setTimeout(function () {
      clearInterval(interval);

      expect(_this.metrics.length).to.be(5);

      expect(
        _this.metrics[0].counters['counter.name'] > 500 &&
        _this.metrics[0].counters['counter.name'] < 1000
      ).to.equal(true);

      expect(
        _this.metrics[1].counters['counter.name'] > 500 &&
        _this.metrics[1].counters['counter.name'] < 1000
      ).to.equal(true);

      expect(
        _this.metrics[2].counters['counter.name'] > 500 &&
        _this.metrics[2].counters['counter.name'] < 1000
      ).to.equal(true);

      expect(
        _this.metrics[3].counters['counter.name'] > 500 &&
        _this.metrics[3].counters['counter.name'] < 1000
      ).to.equal(true);

      expect(
        _this.metrics[4].counters['counter.name'] > 500 &&
        _this.metrics[4].counters['counter.name'] < 1000
      ).to.equal(true);

      done();
    }, 1100);
  });

  xit('emits collected and aggregated gauge metrics', function (done) {

    var _this = this;

    var interval = setInterval(function () {
      _this.client.gauge('counter.name');
    }, 1);

  });

  xit('can reset metrics', function (done) {

  });

});
