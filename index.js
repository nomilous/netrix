global.Promise = global.Promise || require('bluebird');

module.exports = {
  Server: require('./lib/server'),
  Client: require('./lib/client')
}
