/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const http = require('http');


const DEFAULT_ROUTE = '/impinj';
const DEFAULT_PORT = 3001;


/**
 * HttpListener Class
 * Listens for Impinj data from HTTP POST.
 */
class HttpListener {

  /**
   * HttpListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.decoder = options.decoder;

    if(options.app && options.express) {
      createRouteHandler(this, options.app, options.express, options.route);
    }
    else {
      createHttpServer(this, options.port);
    }
  }

}


/**
 * Create the HTTP server and handle events.
 * @param {HttpListener} instance The HttpListener instance.
 * @param {Express} app The express app instance.
 * @param {String} route The route on which to accept POST requests.
 */
function createRouteHandler(instance, app, express, route) {
  route = route || DEFAULT_ROUTE;

  app.use(route, express.json({ type: "application/json" }));

  app.post(route, function(req, res) {
    let time = new Date().getTime();

    instance.decoder.handleData(req.body, 'HTTP', time,
                                instance.decodingOptions);

    res.status(200).end();
  });
}


/**
 * Create the HTTP server and handle events.
 * @param {HttpListener} instance The HttpListener instance.
 * @param {Number} port The port on which to listen.
 */
function createHttpServer(instance, port) {
  port = port || DEFAULT_PORT;

  let server = http.createServer(function(req, res) {
    if(req.method === 'POST') {
      let body = Buffer.alloc(0);
      let time = new Date().getTime();

      req.on('data', function(chunk) {
        body = Buffer.concat([ body, chunk ]);
      });
      req.on('end', function() {
        instance.decoder.handleData(JSON.parse(body), 'HTTP', time,
                                    instance.decodingOptions);
        res.end();
      });
    }
  });

  server.listen(port);
}


module.exports = HttpListener;
