var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('goodtogo-linebot:app');
debug.log = console.log.bind(console);

var debugServer = require('debug')('goodtogo-linebot:server');
var http = require('http');
const line = require('@line/bot-sdk');
const JSONParseError = require('@line/bot-sdk/exceptions').JSONParseError;
const SignatureValidationFailed = require('@line/bot-sdk/exceptions').SignatureValidationFailed;
var basicAuth = require('basic-auth-connect');
var compression = require('compression');
var mongoose = require('mongoose');

var config = require("./config/config");
var bot = require("./routes/bot").handleEvent;
var manager = require("./routes/manager");

/**
 * DB init
 */
mongoose.Promise = global.Promise;
mongoose.connect(config.dbUrl, config.dbOptions, function(err) {
    if (err) throw (err);
    debug('mongoDB connect succeed');
    // require('./tmp/tmp.2')
});

/**
 * EXPRESS init
 */
var app = express();
app.use(logger('dev'));
app.disable('x-powered-by');
var authMiddleWare = basicAuth(config.auth.user, config.auth.pwd);

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '8008');
app.set('port', port);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * BOT router
 */
app.post('/wakeup/webhook', line.middleware(config.bot), (req, res) => {
    Promise
        .all(req.body.events.map(bot))
        .then((result) => res.json(result));
});

/**
 * WEB init
 */
app.set('views', path.join(__dirname, 'views/manager'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(favicon(path.join(__dirname, 'views/assets', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use('/wakeup/images', express.static(path.join(__dirname, 'views/assets/image')));
app.use(authMiddleWare);

/**
 * Status Monitir init
 */
var esm = require('express-status-monitor')({
    title: "GoodToGo LineBot Monitor"
});
app.use(esm.middleware);
app.get('/wakeup/status', esm.pageRoute);

/**
 * WEB router
 */
app.use('/wakeup/assets', express.static(path.join(__dirname, 'views/assets')));
app.use('/wakeup/manager', express.static(path.join(__dirname, 'views/manager')), manager);

/**
 * Error handle
 */
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    if (req.url.indexOf('/status') >= 0) {
        return next();
    }
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// line bot error handler
app.use((err, req, res, next) => {
    if (err instanceof SignatureValidationFailed) {
        res.status(401).send(err.signature);
        return;
    } else if (err instanceof JSONParseError) {
        res.status(400).send(err.raw);
        return;
    }
    next(err); // will throw default 500
});
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    if (err.status !== 404) {
        debug(res.locals.message);
        debug(res.locals.error);
    }

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    debugServer('Listening on ' + bind);
}