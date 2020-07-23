const express = require('express');

const axios = require('axios');


const router = express.Router();

router.post('/send', async (req, res) => {
    const subject = req.body.subject;
    const emailAddress = req.body.emailAddress;
    const messageBody = req.body.messageBody;

    axios.post('http://196.43.106.54:9470/v1/secured/mail', {
        "operation": "SEND_EMAIL",
        "channel": "NMB_MOBILE",
        "accessToken": "8ff744c0-3990-41b6-9c42-a1e98915860e",
        "uuid": "8ff744c0-3990-41b6-9c42-a1e98915860e",
        "requestBody": {
            "to": emailAddress,
            "subject": subject,
            "body": messageBody
        }
    }).then(async function (response) {

        if (response.data.message == "FAILED" || response.data.message == "failed") {
            console.log('\nnmb-school - ' + Date() + ' > ---------------| Email not sent to: ' + emailAddress + '. Reason: ' + response.data.responseBody.reason + '|---------------');
            console.log('\t| Subject: ' + subject + ' |');
            console.log('\t| Body: ' + messageBody + ' |');
            res.status(200).send({
                'statusCode': 500,
                'message': response.data.message,
                'responseBody': {
                    'reason': response.data.responseBody.reason,
                }
            });

        } else {
            console.log('\nnmb-school - ' + Date() + ' > ---------------| Email sent to ' + emailAddress + '|---------------');
            res.status(200).send({
                'statusCode': 201,
                'message': response.data.message,
                'responseBody': {
                    'reason': response.data.responseBody.reason,
                }
            });
        }
    }).catch(function (error) {
        console.log('\nnmb-school - ' + Date() + ' > ---------------| Email not sent to: ' + emailAddress + '.\nReason: ' + error + '\n|---------------');
        res.status(200).send({
            'statusCode': 500,
            'message': 'Failed',
            'responseBody': {
                'reason': 'Server Error. Failed to send email confimation.',
            }
        });
    });
});
module.exports = router;