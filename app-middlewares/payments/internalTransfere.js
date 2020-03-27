const axios = require('axios');
const express = require('express');
const connection = require('../../helpers/connection');
const query = require('../../helpers/query');
const dbConfig = require('../../dbConfig');
const delay = require('delay');
call = '';

const router = express.Router();

router.post('/pay', async (req, res) => {
    const studentId = req.body.studentId;
    const schoolId = req.body.schoolId;
    const studentSurname = req.body.studentSurname;
    const studentName = req.body.studentName;
    const mobileNumber = req.body.mobileNumber;
    const emailAddress = req.body.emailAddress;
    const className = req.body.className;
    const paymentFields = req.body.paymentFields;
    const paymentAmounts = req.body.paymentAmounts;
    const totalAmount = req.body.totalAmount;
    const amount = totalAmount;
    const term = req.body.term;
    const fromAccount = req.body.fromAccount;
    const toAccount = req.body.toAccount;
    payment = undefined;
    paymentReference = '';

    const conn = await connection(dbConfig).catch(e => {});
    axios.post('http://196.43.106.54:9014/v1/rest/iso/internaltransfer', {
            "operation": "INTERNAL_TRANSFER",
            "channel": "SCHOOLFEES",
            "asyncRequest": false,
            "accessToken": "8ff744c0-3990-41b6-9c42-a1e98915860e",
            "uuid": "8ff744c0-3990-41b6-9c42-a1e98915860e",
            "requestBody": {
                "currency": "840",
                "fromAccount": fromAccount,
                "toAccount": toAccount,
                "amount": amount,
                "mobileNumber": mobileNumber
            }
        }).then(async function (response) {
            paymentReference = response.data.responseBody.postilionRRN;
            if (paymentReference != null) {
                for (let i = 0; i < paymentFields.length; i++) {
                    const fieldPaymentReference = paymentFields[i] + '-' + paymentReference;
                    const channel = 'INTERNAL TRANSFERE';
                    const paymentCheck = await query(conn, `SELECT * FROM payments WHERE field_payment_reference = '${fieldPaymentReference}'`);
                    if (paymentCheck.length == 0) {
                        payment = await query(conn, `INSERT INTO payments (payment_reference, field_payment_reference, student_id, school_id, student_surname, student_name, phone_number, email_address, class, term, payment_field, payment_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?)`, [paymentReference, fieldPaymentReference, studentId, schoolId, studentSurname, studentName, mobileNumber, emailAddress, className, term, paymentFields[i], paymentAmounts[i], channel]);
                    } else {
                        console.log('\nnmb-school - ' + Date() + ' > --------------| Duplicate Transaction  ' + fieldPaymentReference + '|---------------');
                        res.status(500).send({
                            'statusCode': 200,
                            'message': 'Success',
                            'responseBody': {
                                'message': 'Duplicate Transaction',
                                'reference': fieldPaymentReference,
                                'amount': totalAmount
                            }
                        });
                    }
                }
                if (payment == undefined) {
                    console.log('\nnmb-school - ' + Date() + ' > ---------------> Customer account hit but - Failed to save payment in local db <---------------');
                    console.log('Payment Details: { \n School ID: ' + schoolId + '\n Transaction Reference : ' + paymentReference + '\n StudentName: ' + studentSurname + ' ' + studentName + ' ' + studentId + '\n}');
                    res.status(500).send({
                        'statusCode': 200,
                        'message': 'Success',
                        'responseBody': {
                            'message': 'Failed to capture payment.',
                            'reference': paymentReference,
                            'amount': totalAmount
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
                                'message': 'Transaction completed successfully',
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
                        'message': 'Transaction could not be completed successfully. Please contact your bank.',
                        'reference': null,
                        'amount': totalAmount
                    }
                });
                res.end();
            }
        })
        .catch(function (error) {
            console.log(error);
        });
});

module.exports = router;