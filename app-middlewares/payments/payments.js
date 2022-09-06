const express = require('express');
const connection = require('../../helpers/connection');
const query = require('../../helpers/query');
const dbConfig = require('../../dbConfig');

const router = express.Router();

// READ ALL
router.get('/payments', async (req, res) => {
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, 'SELECT * FROM payments').catch(console.log);
    res.json({
        results
    });
});

// READ ECOCASH PAYMENTS
router.get('/ecocash', async (req, res) => {
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE channel='ECOCASH'`).catch(console.log);
    res.json({
        results
    });
});

// READ NMB PAYMENTS
router.get('/nmb', async (req, res) => {
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE channel='INTERNAL_TRANSFERE'`).catch(console.log);
    res.json({
        results
    });
});

// READ ZIPIT PAYMENTS
router.get('/zipit', async (req, res) => {
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn,`SELECT * FROM payments WHERE channel='ZIPIT'`).catch(console.log);
    res.json({
        results
    });
});

router.get('/cash', async (req, res) => {
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn,`SELECT * FROM payments WHERE channel='CASH'`).catch(console.log);
    res.json({
        results
    });
});

// GET payments FOR SCHOOL
router.get('/payments/:id', async (req, res) => {
    const id = req.params.id;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE school_id = '${id}'`).catch(console.log);
    res.json({
        results
    });
});

//Date Filter
router.get('/payments/:from/:to', async (req, res) => {
    const from = req.params.from;
    const to = req.params.to;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE created_at >= '${from}' AND created_at <= '${to}'`).catch(console.log);
    res.json({
        results
    });
});

// Get fees per terms
router.post('/term/:id', async (req, res) => {
    console.log('Get All per term');
    const school_id = req.params.id;
    const term = req.body.term;
    const year = req.body.yearOfPayment;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE term = '${term}' AND created_at LIKE '%${year}%' AND school_id='${school_id}'`).catch(console.log);
    res.json({
        results
    });
    res.end();
    conn.end();
});

router.post('/term/ecocash/:id', async (req, res) => {
    console.log('Get Ecocash per term');
    const school_id = req.params.id;
    const term = req.body.term;
    const year = req.body.yearOfPayment;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE term = '${term}' AND created_at LIKE '%${year}%' AND school_id='${school_id}' AND channel = 'ECOCASH'`).catch(console.log);
    res.json({
        results
    });
    res.end();
    conn.end();
});

router.post('/term/zipit/:id', async (req, res) => {
    console.log('Get Zipit per term');
    const school_id = req.params.id;
    const term = req.body.term;
    const year = req.body.yearOfPayment;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE term = '${term}' AND created_at LIKE '%${year}%' AND school_id='${school_id}' AND channel = 'ZIPIT'`).catch(console.log);
    res.json({
        results
    });
    res.end();
    conn.end();
});

router.post('/term/ift/:id', async (req, res) => {
    const school_id = req.params.id;
    const term = req.body.term;
    const year = req.body.yearOfPayment;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE term = '${term}' AND created_at LIKE '%${year}%' AND school_id='${school_id}' AND channel = 'INTERNAL_TRANSFERE'`).catch(console.log);
    res.json({
        results
    });
    res.end();
    conn.end();
});

router.post('/term/cash/:id', async (req, res) => {
    console.log('Get Cash per term');
    const school_id = req.params.id;
    const term = req.body.term;
    const year = req.body.yearOfPayment;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE term = '${term}' AND created_at LIKE '%${year}%' AND school_id='${school_id}' AND channel = 'CASH'`).catch(console.log);
    res.json({
        results
    });
});

module.exports = router;