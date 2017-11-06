global.Promise = global.Promise || require('bluebird');

var NetrixServer = require('./lib/server');
var NetrixClient = require('./lib/client')

module.exports = {
  NetrixServer: NetrixServer,
  NetrixClient: NetrixClient,
  createServer: function(opts) {
    var server = new NetrixServer(opts);
    return server.start();
  }
}
