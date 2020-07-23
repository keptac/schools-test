const axios = require('axios');
const express = require('express');
const connection = require('../../helpers/connection');
const query = require('../../helpers/query');
const dbConfig = require('../../dbConfig');
const delay = require('delay');

const router = express.Router();

router.post('/pay', async (req, res) => {
    const studentId = req.body.studentId;
    const schoolId = req.body.schoolId;
    const studentSurname = req.body.studentSurname;
    const studentName = req.body.studentName;
    const phoneNumber = req.body.phoneNumber;
    const emailAddress = req.body.emailAddress;
    const className = req.body.className;
    const paymentFields = req.body.paymentFields;
    const term = req.body.term;

    const paymentAmounts = req.body.paymentAmounts;
    const totalAmount = req.body.totalAmount;
    const accountNumber = req.body.accountNumber;
    const conn = await connection(dbConfig).catch(e => {});
    var payment = undefined;
    var paymentReference = '';
    var amounts = '';
    var accountNumbers = '';

    for (let i = 0; i < paymentFields.length; i++) {
        amounts = amounts + ',' + paymentAmounts[i];
        accountNumbers = accountNumbers + ',' + accountNumber[i];
    }

    amounts = amounts.replace(/(^,)|(,$)/g, "");
    accountNumbers = accountNumbers.replace(/(^,)|(,$)/g, "");

    // 'http://192.168.10.73:9430/v1/rest/iso/secured/ecocash/pay' 196.43.106.54:9430

    axios.post('http://196.43.106.54:9430/v1/rest/iso/secured/ecocash/pay', {
            'operation': 'SCHOOL_FEES_PAYMENT',
            'async': true,
            'channel': 'SCHOOL_FEES_PORTAL',
            'requestBody': {
                'amount': amounts,
                'accountNumber': accountNumbers,
                'totalAmount': totalAmount,
                'phone': phoneNumber,
                'transactionType': 'SCHOOL_FEES_PAYMENT',
            }
        }).then(async function (response) {
            console.log('\nnmb-school - ' + Date() + ' > ---------------| Waiting for ecocash response |---------------');
            if (response.data.message == "FAILED") {
                console.log('\nnmb-school - ' + Date() + ' > ---------------| Ecocash Initiation failed |---------------');
                console.log('nmb-school - ' + Date() + ' > ' + response.data.responseBody.reason + '\n');
                console.log(response.data);
                res.status(200).send({
                    'statusCode': 200,
                    'message': 'Failed',
                    'responseBody': {
                        'reason': 'Failed to initiate transaction.'
                    }
                });
            } else {
                console.log('\nnmb-school - ' + Date() + ' > ---------------| Ecocash HIT Success |---------------');
                paymentReference = response.data.responseBody.redisInitiatedEcoCash.clientCorrelator;
                await delay(12000);
                //check txn status
                
                for (let i = 0; i < paymentFields.length; i++) {
                    const fieldPaymentReference = paymentFields[i] + '-' + paymentReference;
                    const channel = 'ECOCASH';
                    const paymentCheck = await query(conn, `SELECT * FROM payments WHERE field_payment_reference = '${fieldPaymentReference}'`);
                    if (paymentCheck.length == 0) {
                        payment = await query(conn, `INSERT INTO payments (payment_reference, field_payment_reference, student_id, school_id, student_surname, student_name, phone_number, email_address, class, term, payment_field, payment_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [paymentReference, fieldPaymentReference, studentId, schoolId, studentSurname, studentName, phoneNumber, emailAddress, className, term, paymentFields[i], paymentAmounts[i], channel]);
                    } else {
                        console.log('\nnmb-school - ' + Date() + ' > --------------| Duplicate Transaction  ' + fieldPaymentReference + '|---------------');
                        res.send({
                            'statusCode': 500,
                            'message': 'Duplicte Transaction Error',
                            'responseBody': {
                                'reason': 'Failed to capture payment.',
                                'reference': fieldPaymentReference,
                            }
                        });
                    }
                }

                if (payment == undefined) {
                    console.log('\nnmb-school - ' + Date() + ' > ---------------> Ecocash hit but - Failed to save payment in local db <---------------');
                    console.log('Payment Details: { \n School ID: ' + schoolId + '\n Ecocash Reference : ' + paymentReference + '\n StudentName: ' + studentSurname + ' ' + studentName + ' ' + studentId + '\n}');
                    res.send({
                        'statusCode': 500,
                        'message': 'DB Error',
                        'responseBody': {
                            'reason': 'Failed to capture payment.',
                            'reference': paymentReference,
                        }
                    });
                    res.end();
                } else {
                    (async () => {
                        console.log('nmb-school - ' + Date() + ' ---------------| Transaction Pending Confirmation |---------------');
                        await delay(10000);
                        console.log('nmb-school - ' + Date() + ' ---------------| Payment was successfully captured |---------------\n');

                        res.status(201).send({
                            'statusCode': 201,
                            'message': 'Success',
                            'responseBody': {
                                'reference': paymentReference,
                                'amount': totalAmount
                            }
                        });
                        res.end();
                    })();
                }
            }

        })
        .catch(function (error) {
            console.log(error);
            res.status(200).send({
                'statusCode': 500,
                'message': 'Failed',
                'responseBody': {
                    'reason': 'Transaction could not be completed successfully. Please contact your bank.',
                    'reference': null,
                    'amount': totalAmount
                }
            });
        });
});

module.exports = router;