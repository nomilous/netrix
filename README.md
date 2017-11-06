[![npm](https://img.shields.io/npm/v/netrix.svg)](https://www.npmjs.com/package/netrix)[![Build Status](https://travis-ci.org/nomilous/netrix.svg?branch=master)](https://travis-ci.org/nomilous/netrix)[![Coverage Status](https://coveralls.io/repos/github/nomilous/netrix/badge.svg?branch=master)](https://coveralls.io/github/nomilous/netrix?branch=master)

# netrix

Lightweight, pluggable metrics aggregator, loosely modelled on [statsd](https://github.com/etsy/statsd).



```javascript
const netrix = require('netrix');
```

### netrix.createServer([options])

* `options` \<Object>  Optional.
  * `port` \<number> Listen UPD port. Default 49494.
  * `flushInterval` \<number> Interval at which metrics are aggregated and reported. Default 1000ms.
* Returns \<Promise> Resolve with a running instance of 

## class NetrixServer

```javascript
const {NetrixServer} = require('netrix');
```

This class implements the metrics accumulator and aggregation server. It runs the UDP/datagram server to which all [NetrixClient](#class-netrixclient) instances send their metrics. See `bin/eg-server`.

### new NetrixServer([options])

`options` Same as `netrix.createServer([options])`

`NetrixServer` is an EventEmitter with the following events.

### Event: 'error'

* \<Error>

Emitted when an error occurs on the datagram server.

### Event: 'metric'

* \<string> Metric type 'c' or 'g' for `counter` or `gauge`.
* \<string> Metric name.
* \<number> Metric value.

Emitted for every metric arriving from [netrix.Client](#class-netrixclient) instances.

### Event: 'flush'

* \<number> Timestamp.
* \<Object> Aggregated metrics.
* \<Object> Raw metrics. 

Emitted at `flushInterval` and contains aggregated results from all metrics accumulated since the previous flush.

The `counter` metrics are scaled up or down to a per-second sample even if the `flushInterval` is not 1000ms.

The `counter` metrics are reset to zero at each flush boundary so that the counting can resume appropriately.

The `gauge` metric values remain unchanged until the client sends an update.

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
    'netrix.flush.lag': 3 // builtin, flush timer lag ms
  }
}
```

### server.start()

* Returns \<Promise>

Starts the server.

### server.stop()

* Returns \<Promise>

Stops the server.

### server.reset()

Removes all counters and gauges. Bear in mind that under normal operation once a counter or gauge is created it remains in place and is reported with each flush even if there was no change in value.

## class NetrixClient

See `bin/eg-client`.

### new NetrixClient([options])

* `options` \<Object> Optional.
  * `host` \<string> Hostname of the server. Default 'localhost'
  * `port` \<number> Server port. Default 49494.
  * `flushInterval` \<number> Efficienttly accumulate metrics before sending every default 50ms.
  * `maxDatagram` \<number> Multiple metrics sent in each datagram. Limits size. Default 1024 bytes.
* Returns \<netrix.Client>

`maxDatagram` can theoretically be set as high as 65507 bytes BUT large datagrams simply vanished on OSX laptop. If you decide to deviate from the default do some in-situ benchmarking to determine your sweetspot.

### client.start()

* Returns \<Promise>

Start the client.

### client.stop()

* Return \<Promise>

Stop the client.

### client.increment(metricName[, value])

* `metricName` \<string> For example 'service1.login.failures'.
* `value` <number> Optional. Defaults incrementing counter by 1.

Each call to increment() on the client will result in the counter being incremented at the server. Once the server arrives at the flush boundary the total will be reported in the `flush` event and the counter will be set back to zero at the server.

### client.gauge(metricName, value)

* `metricName` \<string> For example 'host1.cpu.percent_idle'
* `value` <number> The percentage idle.

Each call to gauge() on the client will result in the corresponding guage data being accumulated at the server. These accumulated values will be averaged and reported in the `flush` event.

### client.metric(metricName, value, customTypeCode)

* `metricName`
* `value`
* `customType` \<string> Not a guage ('g') or counter ('c').

This allows for the sending of things other than gauge and counter metrics. The server ignores these. But they do cause the `metric` event to fire and they can be found in each `flush` event in the `raw` data.

