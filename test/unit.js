var expect = require('expect.js');
var Client = require('../').NetrixClient;
var Server = require('../').NetrixServer;

describe('unit', function () {

  context('server', function () {

    context('_onMessage', function () {

      it('accumulates metrics into raw', function () {
        var instance = {
          _data: {
            raw: {}
          },
          emit: function () {}
        }

        var data =
          'counter1.name:1|c\n' +
          'counter1.name:1|c\n' +
          'counter1.name:1|c\n' +
          'counter1.name:1|c\n' +
          'counter1.name:1|c\n' +
          'counter2.name:1|c\n' +
          'counter2.name:1|c\n' +
          'gauge1.name:1.1234|g\n' +
          'gauge1.name:55.5432|g';

        Server.prototype._onMessage.call(instance, data);

        expect(instance._data).to.eql({
          raw: {
            c: {
              'counter1.name': [1, 1, 1, 1, 1],
              'counter2.name': [1, 1],
              'netrix.bytes.received': [168],
              'netrix.frames.received': [1],
              'netrix.metrics.received': [9]
            },
            g: {
              'gauge1.name': [1.1234, 55.5432]
            }
          }
        })

      });

    });

    context('_aggregate', function () {

      it('aggregates the raw metrics', function () {

        var instance = {
          flushInterval: 1000,
          _data: {
            raw: {
              c: {
                counter1: [1, 1, 1],
                counter2: [1, 1, 1, 2]
              },
              g: {
                gauge1: [3.2, 3.2, 0.26],
                gauge2: [1.5, 3.1, 4.4]
              }
            },
            counters: {},
            gauges: {}
          }
        }

        Server.prototype._aggregate.call(instance);

        expect(instance._data.counters).to.eql({
          counter1: 3,
          counter2: 5
        });

        expect(instance._data.gauges).to.eql({
          gauge1: 2.22,
          gauge2: 3
        });

      });

      it('sets counters to zero if no data', function () {

        var instance = {
          flushInterval: 1000,
          _data: {
            raw: {
              c: {
                counter1: [],
                counter2: []
              }
            },
            counters: {
              counter1: 1231,
              counter2: 432
            }
          }
        }

        Server.prototype._aggregate.call(instance);

        expect(instance._data.counters).to.eql({
          counter1: 0,
          counter2: 0
        });

      });

      it('leaves gauges unchanged if no data', function () {

        var instance = {
          flushInterval: 1000,
          _data: {
            raw: {
              g: {
                gauge1: [],
                gauge2: []
              }
            },
            gauges: {
              gauge1: 200.123,
              gauge2: 3.2132
            }
          }
        }

        Server.prototype._aggregate.call(instance);

        expect(instance._data.gauges).to.eql({
          gauge1: 200.123,
          gauge2: 3.2132
        });

      });

      it('up-samples to per second counters', function () {

        var instance = {
          flushInterval: 100,
          _data: {
            raw: {
              c: {
                counter1: [1, 1, 1],
                counter2: [1]
              }
            },
            counters: {},

          }
        }

        Server.prototype._aggregate.call(instance);

        expect(instance._data.counters).to.eql({
          counter1: 30,
          counter2: 10
        });

        instance.flushInterval = 10000;

        Server.prototype._aggregate.call(instance);

        expect(instance._data.counters).to.eql({
          counter1: 0.3,
          counter2: 0.1
        });

      });

    });

    context('_clear', function () {

      it('clears the raw data', function () {

        var instance = {
          _data: {
            raw: {
              c: {
                counter1: [1, 1, 1],
                counter2: [1, 1, 1, 2]
              },
              g: {
                gauge1: [3.2, 3.2, 0.26],
                gauge2: [1.5, 3.1, 4.4]
              }
            }
          }
        }

        Server.prototype._clear.call(instance);

        expect(instance._data.raw).to.eql({
          c: {
            counter1: [],
            counter2: []
          },
          g: {
            gauge1: [],
            gauge2: []
          }
        });

      });

    });

  });

  context('client', function () {

    context('_generateBuffers', function () {

      it('creates a buffer array of one if size is within bounds',
        function () {
          var instance = {
            maxDatagram: 200
          };

          var dataArray = ['111', '222', '333', '444'];

          var result = Client.prototype._generateBuffers.call(
            instance,
            dataArray
          );

          expect(result).to.eql(['111\n222\n333\n444']);
        }
      );

      it('divides into multiple buffers if payload exceeds bounds',
        function () {
          var instance = {
            maxDatagram: 10
          };

          var dataArray = [
            '111', '222', '333', '444', '555',
            '666', '777', '888', '999', '1010',
            '1111'
          ];

          var result = Client.prototype._generateBuffers.call(
            instance,
            dataArray
          );

          expect(result).to.eql([
            '111\n222',
            '333\n444',
            '555\n666',
            '777\n888',
            '999\n1010',
            '1111'
          ]);

        }

      );

    });

  });

});
