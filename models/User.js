var q = require('q');
var mongoose = require('mongoose');
var crypto = require('crypto');
var generatePassword = require('password-generator');
var jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        unique: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true
    },
    hash: String,
    salt: String,
    type: String,
    facebookid: Number,
    validEmail: Boolean
});

userSchema.statics.findByUserId = function(id) {
    var deferred = q.defer();

    this.findById(id, function(error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

userSchema.statics.findByEmail = function(email) {
    var deferred = q.defer();

    this.find({
        'email': email
    }, function(error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

userSchema.statics.findByFacebookId = function(facebookId) {
    var deferred = q.defer();

    this.find({
        facebookid: facebookId
    }, function(error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(data);
        }
    });
    return deferred.promise;
};

userSchema.statics.findOrCreate = function(facebookUser, fn) {
    this.findByFacebookId(facebookUser.id).then(function(data) {

      console.log(facebookUser);
        var User = mongoose.model('User');
        var user = new User();

        if (data.length > 0) {
            user = data[0];
            var token = user.generateJWT();
            fn(null, token);
        } else {
            user.username = facebookUser.displayName;
            user.validEmail = true;
            user.type = 'facebook';
            user.facebookid = facebookUser.id;
            user.email = facebookUser.emails[0].value;

            console.log("user");
            user.save(function(err) {
                console.log(err);
                if (err) {
                    fn(err);
                }

                var token = user.generateJWT();
                fn(null, token);
            });
        }
    }, function(err) {});
};

userSchema.methods.changePassword = function(req) {
    if (this.validPassword(req.body.email.password)) {
        this.hash = crypto.pbkdf2Sync(req.body.email.newPassword, this.salt, 1000, 64).toString('hex');
        this.save();
        return true;
    } else {
        return false;
    }
};

userSchema.methods.setPassword = function(password) {

    this.salt = crypto.randomBytes(16).toString('hex');

    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

userSchema.methods.setRandomPassword = function() {
    var password = generatePassword(8, false, /[\w\d\?\-]/);

    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
    this.save();
    return password;
};

userSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

    return this.hash === hash;
};

userSchema.methods.generateJWT = function() {

    // set expiration to 60 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000),
    }, 'SECRET');
};

module.exports.UserSchema = userSchema;
module.exports.User = mongoose.model('User', userSchema);
