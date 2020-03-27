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

// GET payments FOR SCHOOL
router.get('/payments/:id', async (req, res) => {
    const id = req.params.id;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE school_id = '${id}'`).catch(console.log);
    res.json({
        results
    });
});

router.get('/payments/:from/:to', async (req, res) => {
    const from = req.params.from;
    const to = req.params.to;
    const conn = await connection(dbConfig).catch(e => {});
    const results = await query(conn, `SELECT * FROM payments WHERE created_at >= '${from}' AND created_at <= '${to}'`).catch(console.log);
    res.json({
        results
    });
});

module.exports = router;