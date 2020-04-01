const express = require('express');
var nodemailer = require('nodemailer');

const router = express.Router();

router.post('/send', async (req, res) => {

    const subject = req.body.subject;
    const emailAddress = req.body.emailAddress;
    const messageBody = req.body.messageBody;

    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'keptac.flutter@gmail.com',
            pass: 'p@n@shek'
        }
    });

    var mailOptions = {
        from: 'keptac.flutter@gmail.com',
        to: emailAddress,
        subject: subject,
        text: messageBody
        // html: '<h1>Welcome</h1><p>That was easy! So Easy</p>'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.send(200).send({
                'statusCode': 500,
                'message': 'Failed',
                'responseBody': {
                    'message': 'Message sending failed',
                }
            });
            res.end();
        } else {
            console.log('Email sent to ' +emailAddress );
            res.send(200).send({
                'statusCode': 200,
                'message': 'Success',
                'responseBody': {
                    'message': 'Email sent',
                }
            });
            res.end();
        }
    });

});
module.exports = router;