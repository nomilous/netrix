var expect = require('expect.js');
var Server = require('../').NetrixServer;
var Client = require('../').NetrixClient;

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
    this.server.on('flush', function (timestamp, metrics) {
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
      expect(_this.metrics[0].counters['counter.name']).to.equal(5);
      expect(_this.metrics[1].counters['counter.name']).to.equal(0);
      expect(_this.metrics[2].counters['counter.name']).to.equal(15);

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

  it('emits collected and aggregated gauge metrics', function (done) {
    var _this = this;

    setTimeout(function () {
      expect(_this.metrics[0].gauges['gauge.name']).to.equal(1.5);
      expect(_this.metrics[1].gauges['gauge.name']).to.equal(1.5);
      expect(_this.metrics[2].gauges['gauge.name']).to.equal(1.15);

      done();
    }, 700); // encapsulates 3 x 200ms (flushInterval)

    setTimeout(function () {
      _this.client.gauge('gauge.name', 1.5);
    }, 100); // into first report (flush)

    setTimeout(function () {
      _this.client.gauge('gauge.name', 1.2);
      _this.client.gauge('gauge.name', 1.1);
      // _this.client.gauge('gauge.name', 1);
    }, 450); // into 3rd report (flush)
  });

  it('counts metrics and messages', function (done) {
    var _this = this;

    this.client.increment('counter.name');
    this.client.increment('counter.name');
    this.client.increment('counter.name');
    this.client.increment('counter.name');
    this.client.increment('counter.name');

    setTimeout(function () {
      expect(_this.metrics[0].counters['netrix.bytes.received']).to.equal(420);
      expect(_this.metrics[0].counters['netrix.frames.received']).to.equal(5);
      expect(_this.metrics[0].counters['netrix.metrics.received']).to.equal(25);

      done();
    }, 300);

  });


  it('gauges flush lag', function (done) {
    var _this = this;

    setTimeout(function () {

      expect(_this.metrics[0].gauges['netrix.flush.lag']).to.be.lessThan(10);
      done();

    }, 300);

  });

  it('can reset metrics', function (done) {
    var _this = this;

    this.client.increment('counter.name');

    setTimeout(function () {
      _this.server.reset();
      _this.metrics.length = 0;
    }, 300);

    setTimeout(function () {

      expect(_this.metrics[0].counters).to.eql({
        'netrix.bytes.received': 0,
        'netrix.frames.received': 0,
        'netrix.metrics.received': 0
      });

      expect(Object.keys(_this.metrics[0].gauges)).to.eql([
        'netrix.flush.lag'
      ]);

      done();
    }, 500);

  });

});
