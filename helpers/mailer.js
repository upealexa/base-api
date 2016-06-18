var nodemailer = require('nodemailer');
var q = require('q');
var i18n = require('i18n');
var i18nConfig = require('../i18n.js');
var global = require('../etc/globals');

module.exports.sendValidationMail = (user, req) => {
    var msg = req.__("Use the following link to validate your e-mail: ");
    var subject = req.__("Access");
    console.log(msg);
    var html = msg + '<a href="http://' +
        req.headers.host + '/auth/validate?id=' + user._id + '">' + user.username + '</a>';

    var message = {
        from: global.EMAIL_USER,
        to: user.email,
        subject: subject,
        html: html
    };

    SendEmail(message);
};

module.exports.sendPassword = (email, password, req) => {
  console.log(email);
    var msg = req.__("You have demanded your password: ") + password;
    var subject = req.__("Password recovery");

    var message = {
        from: global.EMAIL_USER,
        to: email,
        subject: subject,
        text: msg
    };

    SendEmail(message);
};

function CreateSmtpTransport() {
    return nodemailer.createTransport("SMTP", {
        host: global.EMAIL_HOST,
        port: global.EMAIL_HOST_PORT,
        auth: {
            user: global.EMAIL_USER,
            pass: global.EMAIL_PASSWORD
        },
        logger: true
    });
}


function SendEmail(message) {
    var smtpTransport = CreateSmtpTransport();
    console.log(message);

    smtpTransport.sendMail(message, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }
    });
}
