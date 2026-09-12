const server = require('./dist/server.js');
const app = server.default || server.app || server;

module.exports = app;
module.exports.default = app;
module.exports.app = app;

