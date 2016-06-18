var express = require('express');
var i18n = require('i18n');
var authRouter = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var User = mongoose.model('User');
var mailer = require('../helpers/mailer');
var Parameter = require('../models/Parameter').Parameter;
var jwt = require('express-jwt');

var auth = jwt({
    secret: 'SECRET',
    userProperty: 'payload'
});

authRouter.post('/register', function(req, res, next) {
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({
            message: res.__('Please fill out all fields')
        });
    }

    var user = new User();

    user.username = req.body.username;
    user.email = req.body.email;
    user.type = 'base';
    user.validEmail = false;

    user.setPassword(req.body.password);

    user.save(function(err) {
        if (err) {
            return res.status(400).json({
                message: res.__(err.message.substring(1, 62))
            });
        }

        Parameter.getParameters().then(function(data) {
            if (data[0].emailValidation === true) {
                mailer.sendValidationMail(user, req);
            }

        }, function(err) {
            console.log(err);
        });
        return res.json({
            token: user.generateJWT()
        });
    });
});

authRouter.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: res.__('Please fill out all fields')
        });
    }

    passport.authenticate('local', function(err, user, info) {
      console.log(info);
        if (err) {
            return next(err);
        }

        if (user) {
            if (user.validEmail === true) {
                return res.json({
                    token: user.generateJWT()
                });
            } else {
                Parameter.getParameters().then(function(data) {
                    if (data[0].emailValidation === true) {
                        return res.status(400).json({
                            message: res.__("Please check if this user is validated")
                        });
                    } else {
                        return res.json({
                            token: user.generateJWT()
                        });
                    }
                });
            }
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

authRouter.post('/recoverPassword', function(req, res, next) {
    User.findByEmail(req.body.email).then(function(data) {
        if (data.length > 0 && data[0]) {
            var password = data[0].setRandomPassword();
            mailer.sendPassword(data[0].email, password, req);
            return res.json({
                msg: "Password sent"
            });
        } else {
            return res.status(400).json({
                message: res.__('e-mail not found')
            });
        }
    }, function(err) {});
});

authRouter.post('/changePassword', auth, function(req, res, next) {
    if (req.body.email.newPassword != req.body.email.confirmNewPassword)
        return res.status(400).json({
            message: res.__('New password and confirmation are not the same')
        });

    User.findByUserId(req.payload._id).then(function(data) {
        if (data) {
            if (data.changePassword(req) === true) {
                console.log("s");
                return res.json({
                    msg: "Password changed"
                });
            } else {
                return res.status(400).json({
                    message: res.__('Invalid passord')
                });
            }

        } else {
            return res.status(400).json({
                message: res.__('user not found')
            });
        }
    }, function(err) {
        console.log(err);
    });
});

authRouter.get('/validate', function(req, res, next) {
    Parameter.getParameters().then(function(data) {
        if (data[0].emailValidation === true) {
            User.findByUserId(req.query.id).then(function(data) {
                if (data.validEmail === false || !data.validEmail) {
                    user = data;
                    user.validEmail = true;
                    user.save(function(err) {
                        if (err) {
                            return res.status(400).json({
                                message: err.message
                            });
                        }

                        return res.json(user);
                    });
                }
            }, function(err) {
                console.log(err);
            });
        } else {
            return res.status(400).json();
        }

    }, function(err) {
        console.log(err);
    });
});

authRouter.get('/facebooklogin', passport.authenticate('facebook', { scope: ['email'] }));

authRouter.get('/facebookcallback', passport.authenticate('facebook', {
    failureRedirect: '/login'
}), function(req, res) {
    res.redirect('http://localhost:8000/#/facebook_login_callback?token=' + req.session.passport.user);
});

module.exports = authRouter;
