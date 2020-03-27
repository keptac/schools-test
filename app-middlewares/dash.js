const express = require('express');
const connection = require('../helpers/connection');
const query = require('../helpers/query');
const dbConfig = require('../dbConfig');

const router = express.Router();

router.get('/dash/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await connection(dbConfig).catch(e => {});

  if (id.toLowerCase == 'all') {
    const paymentsCount = await query(conn, `SELECT(SELECT COUNT(*) FROM payments) as totalPayments`).catch(console.log);
    const paymentsValue = await query(conn, `SELECT(SELECT SUM(payment_amount) FROM payments) as totalValue`).catch(console.log);
    const schoolUsers = await query(conn, `SELECT(SELECT COUNT(*) FROM school_user) as totalUsers`).catch(console.log);
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
      'responseBody': {
        'paymentsCount': paymentsCount[0].totalPayments,
        'paymentsValue': paymentsValue[0].totalValue,
        'users': schoolUsers[0].totalUsers
      }
    });
  } else {
    const paymentsCount = await query(conn, `SELECT(SELECT COUNT(1) FROM payments WHERE school_id = '${id}') as totalPayments`).catch(console.log);
    const paymentsValue = await query(conn, `SELECT(SELECT SUM(payment_amount) FROM payments WHERE school_id = '${id}') as totalValue`).catch(console.log);
    const schoolUsers = await query(conn, `SELECT(SELECT COUNT(1) FROM school_user WHERE school_id = '${id}') as totalUsers`).catch(console.log);
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
      'responseBody': {
        'paymentsCount': paymentsCount[0].totalPayments,
        'paymentsValue': paymentsValue[0].totalValue,
        'users': schoolUsers[0].totalUsers
      }
    });
  }


});


module.exports = router;