var q = require('q');
var mongoose = require('mongoose');

var parameterSchema = new mongoose.Schema({
    emailValidation: Boolean
});

parameterSchema.statics.getParameters = function() {
    var deferred = q.defer();

    this.find({}, function(error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve(data);
        }
    });
    return deferred.promise;
};

module.exports.ParameterSchema = parameterSchema;
module.exports.Parameter = mongoose.model('Parameter', parameterSchema);
