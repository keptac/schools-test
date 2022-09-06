const axios = require('axios');
const express = require('express');
const connection = require('../../helpers/connection');
const query = require('../../helpers/query');
const dbConfig = require('../../dbConfig');
// const delay = require('delay');

const router = express.Router();

router.post('/pay', async (req, res) => {
    console.log('\nnmb-school - ' + Date() + ' > ---------------| Initiating IF Transfer |---------------');
    
    const studentId = req.body.studentId;
    const schoolId = req.body.schoolId;
    const studentSurname = req.body.studentSurname;
    const studentName = req.body.studentName;
    const mobileNumber = req.body.mobileNumber;
    const emailAddress = req.body.emailAddress;
    const className = req.body.className;
    const term = req.body.term;

    const paymentFields = req.body.paymentFields;
    const paymentAmounts = req.body.paymentAmounts;
    const accountNumber = req.body.toAccount;
    const totalAmount = req.body.totalAmount;

    console.log('\nnmb-school - ' + Date() + ' > ---------------| Initiating IF Transfer 2 |---------------');
    console.log(paymentAmounts);
    console.log(accountNumber);

    const fromAccount = req.body.fromAccount;
    payment = undefined;
    paymentReference = '';
    var toAccounts = '';
    var amounts = '';
    var referenceSent = '';

    for (let i = 0; i < paymentFields.length; i++) {
        amounts = amounts + ',' + paymentAmounts[i];
        toAccounts = toAccounts + ',' + accountNumber[i];
        referenceSent = referenceSent + ',' + paymentFields[i];
    }

    amounts = amounts.replace(/(^,)|(,$)/g, "");
    toAccounts = toAccounts.replace(/(^,)|(,$)/g, "");

    console.log('\nnmb-school - ' + Date() + ' > ---------------| Initiating IF Transfer 4 |---------------');

    const conn = await connection(dbConfig).catch(e => { });

  
        axios.post(process.env.LIVE_IFT_URL, {
            "operation": "SCHOOL_FEES_PAYMENT_INTERNAL_TRANSFER",
            "channel": "NMB",
            "asyncRequest": false,
            "accessToken": process.env.LIVE_IFT_URL,
            "uuid": "",
            "requestBody": {
                "currency": "840",
                "fromAccount": fromAccount,
                "toAccount": toAccounts,
                "nmbReference": "fees",
                "amount": amounts,
                "mobileNumber": mobileNumber
            }

        }).then(async function (response) {
            console.log('\nnmb-school - ' + Date() + ' > ---------------| Waiting for server response |---------------');
            if (response.data.message == "FAILED" || response.data.message == "failed") {
                console.log('\nnmb-school - ' + Date() + ' > ---------------| IFT Initiation failed |---------------');
                console.log('nmb-school - ' + Date() + ' > ' + response.data.responseBody.reason + '\n');
                console.log(response.data);
                res.status(200).send({
                    'statusCode': 200,
                    'message': 'Failed',
                    'responseBody': {
                        'reason': response.data.responseBody.reason
                    }
                });
            } else {
                console.log(response.data);
                paymentReference = response.data.responseBody.postilionRRN;
                if (paymentReference != null) {
                    for (let i = 0; i < paymentFields.length; i++) {
                        const fieldPaymentReference = paymentFields[i] + '-' + paymentReference;
                        const channel = 'INTERNAL_TRANSFER';
                        const paymentCheck = await query(conn, `SELECT * FROM payments WHERE field_payment_reference = '${fieldPaymentReference}'`);
                        if (paymentCheck.length == 0) {
                            payment = await query(conn, `INSERT INTO payments (payment_reference, field_payment_reference, student_id, school_id, student_surname, student_name, phone_number, email_address, class, term, payment_field, payment_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?)`, [paymentReference, fieldPaymentReference, studentId, schoolId, studentSurname, studentName, mobileNumber, emailAddress, className, term, paymentFields[i], paymentAmounts[i], channel]);
                        } else {
                            console.log('\nnmb-school - ' + Date() + ' > --------------| Duplicate Transaction  ' + fieldPaymentReference + '|---------------');
                            res.status(200).send({
                                'statusCode': 200,
                                'message': 'Success',
                                'responseBody': {
                                    'reason': 'Duplicate Transaction',
                                    'reference': fieldPaymentReference,
                                    'amount': totalAmount
                                }
                            });
                        }
                    }
                    if (payment == undefined) {
                        console.log('\nnmb-school - ' + Date() + ' > ---------------> Customer account hit but - Failed to save payment in local db <---------------');
                        console.log('Payment Details: { \n School ID: ' + schoolId + '\n Transaction Reference : ' + paymentReference + '\n StudentName: ' + studentSurname + ' ' + studentName + ' ' + studentId + '\n}');
                        res.status(200).send({
                            'statusCode': 500,
                            'message': 'Success',
                            'responseBody': {
                                'reason': 'Failed to capture payment.',
                                'reference': paymentReference,
                                'amount': totalAmount
                            }
                        });
                        res.end();
                    } else {
                        (async () => {
                            console.log('nmb-school - ' + Date() + ' ---------------| Transaction Pending |---------------');
                            // await delay(10000);
                            console.log('nmb-school - ' + Date() + ' ---------------| Payment was successfully captured |---------------\n');
                            res.status(201).send({
                                'statusCode': 201,
                                'message': 'Success',
                                'responseBody': {
                                    'reason': 'Transaction completed successfully',
                                    'reference': paymentReference,
                                    'amount': totalAmount
                                }
                            });
                            res.end();
                        })();
                    }
                } else {
                    res.status(200).send({
                        'statusCode': 200,
                        'message': 'Failed',
                        'responseBody': {
                            'reason': 'Transaction could not be completed successfully. Please contact your bank.',
                            'reference': null,
                            'amount': totalAmount
                        }
                    });
                    res.end();
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