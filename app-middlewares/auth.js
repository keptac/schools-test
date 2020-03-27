const express = require('express');
const connection = require('../helpers/connection');
const query = require('../helpers/query');
const dbConfig = require('../dbConfig');
const create = require('../crud/create');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const conn = await connection(dbConfig).catch(e => {});
  const result = await create(
    conn,
    'users',
    ['username', 'password'],
    [username, { toString: () => `MD5('${password}')`}]
  );

  const [user = {}] = result;
  res.send({
    id: user.id || null,
    username: user.username || null,
  });
});

module.exports = router;
