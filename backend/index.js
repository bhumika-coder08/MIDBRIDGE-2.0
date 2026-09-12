const server = require('./dist/server.js');
const expressApp = server.default || server.app || server;

function handler(req, res) {
  return expressApp(req, res);
}

Object.setPrototypeOf(handler, expressApp);
Object.assign(handler, expressApp);

handler.app = expressApp;
handler.default = handler;

module.exports = handler;
module.exports.default = handler;
module.exports.app = expressApp;


