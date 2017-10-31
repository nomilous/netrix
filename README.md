[![npm](https://img.shields.io/npm/v/netrix.svg)](https://www.npmjs.com/package/netrix)[![Build Status](https://travis-ci.org/nomilous/netrix.svg?branch=master)](https://travis-ci.org/nomilous/netrix)[![Coverage Status](https://coveralls.io/repos/github/nomilous/netrix/badge.svg?branch=master)](https://coveralls.io/github/nomilous/netrix?branch=master)

# netrix

Lightweight, pluggable metrics aggregator, loosely modelled on [statsd](https://github.com/etsy/statsd).



```javascript
const netrix = require('netrix');
```



## class netrix.Server

This class implements the metrics accumulator and aggregation server. It runs the UDP/datagram server to which all [netrix.Client](#class-netrixclient) instances send their metrics.

### new netrix.Server([options])

* `options` <Object>  Optional.
  * `port` <number> Port upon. Default 49494.
  * `flushInterval` <number> Interval at which metrics are aggregated and reported. Default 1000ms.
* Returns <netrix.Server>

`netrix.Server` is an EventEmitter with the following events.

### Event: 'error'

* \<Error>

Emitted when an error occurs on the datagram server.

### Event: 'metric'

* <string> Metric type 'c' or 'g' for `counter` or `gauge`.
* <string> Metric name.
* <number> Metric value.

Emitted for every metric arriving from [netrix.Client](#class-netrixclient) instances.

### Event: 'flush'

* <number> Timestamp.
* <Object> Aggregated metrics.
* <Object> Raw metrics. 

Emitted at `flushInterval` and contains aggregated results from all metrics accumulated since the previous flush.

The `counter` metrics are scaled up or down to a per-second sample even if the `flushInterval` is not 1000ms.

The `counter` metrics are reset to zero at each flush boundary so that the counting can resume appropriately.

The `gauge` metric values are carried over the flush boundary unchanged.

Example metrics object:

```javascript
{
  counters: {
    'netrix.bytes.received': 5773742,  // builtin, bytes received since last flush
    'netrix.frames.received': 5674,    // frames received since last flush
    'netrix.metrics.received': 481618, // metrics received since last flush
    counter1: 481618 // user counter from client.increment('counter1');
  },
  gauges: {
    'netrix.flush.lag': 3 // builtin, flush timer lag
  }
}
```

  

 





## class netrix.Client



x

x

x

x

x

x

x

x

x

x

x

x



