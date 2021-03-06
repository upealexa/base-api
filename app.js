var express = require('express');
var i18n = require('i18n');
var i18nConfig = require('./i18n.js');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var q = require('q');
var mongoose = require('mongoose');
var passport = require('passport');
var facebookStrategy = require('passport-facebook').Strategy;

require('./models/Parameter');
require('./models/User');
require('./config/passport');

var User = mongoose.model('User');

var routes = require('./routes/index');
var authRouter = require('./routes/authRouter');

var app = express();

app.use(cors());

mongoose.connect('mongodb://localhost/base');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(i18nConfig);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new facebookStrategy({
        clientID: 920922144697123,
        clientSecret: '1511f98f40d2b4b9b43960ca0e485434',
        callbackURL: "http://localhost:3000/auth/facebookcallback",
        profileFields: ['emails']
    },
    function(accessToken, refreshToken, profile, done) {
        User.findOrCreate(profile, function(err, user) {
            if (err) {
              console.log("ERR");
                return done(err);
            }
            done(null, user);
        });
    }
));

app.use('/', routes);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
