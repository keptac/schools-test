const axios = require('axios');
const express = require('express');
const connection = require('../../helpers/connection');
const query = require('../../helpers/query');
const dbConfig = require('../../dbConfig');

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
    const paymentAmounts = req.body.paymentAmounts;
    const totalAmount = req.body.totalAmount;
    const term = req.body.term;
    payment = undefined;

    const conn = await connection(dbConfig).catch(e => {});
    const paymentReference = 'NMBSC' + Math.floor(Math.random() * 1109009071);

    for (let i = 0; i < paymentFields.length; i++) {
        const fieldPaymentReference = paymentFields[i] + '-' + paymentReference;
        const channel = 'CASH';
        const paymentCheck = await query(conn, `SELECT * FROM payments WHERE field_payment_reference = '${fieldPaymentReference}'`);
        if (paymentCheck.length == 0) {
            payment = await query(conn, `INSERT INTO payments (payment_reference, field_payment_reference, student_id, school_id, student_surname, student_name, phone_number, email_address, class, term, payment_field, payment_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?)`, [paymentReference, fieldPaymentReference, studentId, schoolId, studentSurname, studentName, phoneNumber, emailAddress, className, term, paymentFields[i], paymentAmounts[i], channel]);
        } else {
            console.log('\nnmb-school - ' + Date() + ' > --------------| Duplicate Transaction  ' + fieldPaymentReference + '|---------------');
            res.status(200).send({
                'statusCode': 500,
                'message': 'Duplicte Transaction Error',
                'responseBody': {
                    'message': 'Failed to capture payment.',
                }
            });
        }
    }

    if (payment == undefined) {
        console.log('Payment Details: { \n School ID: ' + schoolId + '\n Reference : ' + paymentReference + '\n StudentName: ' + studentSurname + ' ' + studentName + ' ' + studentId + '\n}');
        res.status(200).send({
            'statusCode': 500,
            'message': 'DB Error',
            'responseBody': {
                'message': 'Failed to capture payment.',
            }
        });
        res.end();
    } else {
        (async () => {
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
});

module.exports = router;