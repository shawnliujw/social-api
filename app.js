var express = require('express');
var http = require('http');
var dispatcher = require("./lib/dispatcher");
var systemMonitor = require("./lib/systemMonitor");
var config = require("config");
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorhandler = require('errorhandler');
// all environments

var app = express();

app.use(compression());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(morgan('dev'));
if (process.env.NODE_ENV === 'development') {
    app.use(errorhandler())
}
app.set("port", config.listener.port);
require('./routes')(app);
dispatcher.create().then(function () {
    http.createServer(app).listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
});

systemMonitor.start();