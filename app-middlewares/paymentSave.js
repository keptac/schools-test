const express = require('express');
const query = require('../helpers/query');
const dbConfig = require('../dbConfig');

const router = express.Router();

router.post('/save', async (req, res) => {
    console.log('\nnmb-school - ' + Date() + ' > ---------------| Saving Successful Payment |---------------');

    const conn = await connection(dbConfig).catch(e => {
        error.log(e)
    });

    try {
        const paymentReference = req.body.paymentReference;
        const fieldPaymentReference = req.body.fieldPaymentReference;
        const studentId = req.body.studentId;
        const schoolId = req.body.schoolId;
        const studentSurname = req.body.studentSurname;
        const studentName = req.body.studentName;

        const mobileNumber = req.body.mobileNumber;
        const emailAddress = req.body.emailAddress;
        const className = req.body.className;

        const term = req.body.term;
        const paymentField = req.body.paymentField;
        const paymentAmount = req.body.paymentAmount;
        const channel = req.body.channel;

        payment = await query(conn, `INSERT INTO payments (payment_reference, field_payment_reference, student_id, school_id, student_surname, student_name, phone_number, email_address, class, term, payment_field, payment_amount, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?)`, [paymentReference, fieldPaymentReference, studentId, schoolId, studentSurname, studentName, mobileNumber, emailAddress, className, term, paymentField, paymentAmount, channel]);
        res.status(201).send({
            'statusCode': 201,
            'success': true,
            'responseBody': {
                'message': 'Transaction completed successfully',
                'reference': paymentReference,
                'amount': totalAmount
            }
        });
        res.end();
    } catch (error) {
        res.status(200).send({
            'statusCode': 500,
            'success': false,
            'responseBody': {
                'reason': error
            }
        });
        res.end();
    }
});

module.exports = router;