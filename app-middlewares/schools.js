const express = require('express');
const connection = require('../helpers/connection');
const query = require('../helpers/query');
const schoolQuery = require('../query-builders/school-query');
const feesStructureQuery = require('../query-builders/feesStructure-query');
const feesStructureSchool = require('../query-builders/feesStructure-school');
const dbConfig = require('../dbConfig');
const router = express.Router();
const fee_struct = '';






// var ConnectionPool = require('tedious-connection-pool');
// var Request = require('tedious').Request;

// var poolConfig = {
//   min: 2,
//   max: 4,
//   log: true
// };

// var connectionConfig = {
//   userName: 'root',
//   password: '',
//   server: 'localhost',
//   database: 'school_fees_db',
//   driver: 'tedious',
//   options: {
//       instanceName: 'sql'
//   }
// };

// //create the pool

router.get('/school/test', async (req, res) => {

  var pool = new ConnectionPool(poolConfig, connectionConfig);

  pool.on('error', function (err) {
    console.error(err);
  });

  //acquire a connection
  pool.acquire(function (err, connection) {
    if (err) {
      console.error(err);
      return;
    }

    //use the connection as normal
    var request = new Request('SELECT * FROM school', function (err, rowCount) {
      if (err) {
        console.error(err);
        return;
      }

      console.log('rowCount: ' + rowCount);

      //release the connection back to the pool when finished
      connection.release();
    });

    request.on('row', function (columns) {
      console.log('value: ' + columns[0].value);
    });

    connection.execSql(request);
  });

  // pool.drain();
});










// POST Request - Add New School
router.post('/school', async (req, res) => {
  const schoolId = 'NMBSC' + Math.floor(Math.random() * 1000);
  const schoolName = req.body.schoolName;
  const schoolAddress = req.body.schoolAddress;
  const logoUrl = req.body.logoUrl;
  const category = req.body.category;
  const statusCode = req.body.statusCode || '011';
  const createdBy = req.body.createdBy;
  const updatedBy = req.body.updatedBy;

  const conn = await connection(dbConfig).catch(e => {
    error.log(e)
  });

  const school = await query(conn, `INSERT INTO school (school_id, school_name, school_address, logo_url, category, status_code, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [schoolId, schoolName, schoolAddress, logoUrl, category, statusCode, createdBy, updatedBy]);
  if (school == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------| SCHOOL ONBOARDING FAILED |---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error',
      'responseBody': {
        'message': 'Failed to capture school into Database.',
        'schoolId': null,
        'status': null
      }
    });
  } else {
    console.log('\n\n---------------| SCHOOL ADDED SUCCESSFULLY |---------------');
    console.log('nmb-school - ' + Date() + ' > [ ' + schoolId + ': ' + schoolName + ' ]');
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
      'responseBody': {
        'schoolId': schoolId,
        'status': statusCode
      }
    });
  }
  res.end();
});

router.get('/schools', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, 'SELECT * FROM school').catch(console.log);

  console.log('\n\nmb-school - ' + Date() + ' > --------------| Returned All Schools |--------------');
  res.json({
    results
  });
});

router.get('/schools-verified', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, 'SELECT * FROM school WHERE status_code = 111 OR status_code=110').catch(console.log);

  if (results == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------> SCHOOOL SEARCH FAILED <---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error'
    });
  } else {
    console.log('\n\nnmb-school - ' + Date() + ' > --------------| Returned Verified Schools |--------------');
    res.json({
      results
    });
  }
});

router.get('/school/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await connection(dbConfig).catch(e => {});
  const school = await query(conn, schoolQuery(), [id]);

  if (school == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------> SCHOOOL SEARCH FAILED <---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error'
    });
  } else {
    s
    console.log('\nnmb-school - ' + Date() + ' > --------------| Returned School with id: ' + id + ' |---------------');
    res.send(school[0]);
  }
});

// Config Fees Structure
router.post('/fees-struct', async (req, res) => {
  const schoolId = req.body.schoolId;
  const feesDetails = req.body.feesDetails;
  const status = req.body.status;
  const createdBy = req.body.createdBy;
  const updatedBy = req.body.updatedBy;
  const schoolStatusCode = req.body.schoolStatusCode;
  fees_struct = [];

  const conn = await connection(dbConfig).catch(e => {});

  const schoolActivate = await query(conn, `UPDATE school SET status_code = '${schoolStatusCode}' WHERE school_id = '${schoolId}'`);

  for (let i = 0; i < feesDetails.length; i++) {
    const configCheck = await query(conn, `SELECT * FROM fees_structure WHERE school_id = '${schoolId}' AND field = '${feesDetails[i].feesField}'`);
    if (configCheck.length == 0) {
      fees_struct = await query(conn, `INSERT INTO fees_structure (school_id, account_number, bank, branch, field, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [schoolId, feesDetails[i].accountNumber, feesDetails[i].bank, feesDetails[i].branch, feesDetails[i].feesField, status, createdBy, updatedBy]);
    } else {
      console.log('nmb-school - ' + Date() + ' > ---------------| Configuration already exists |---------------');
      res.status(200).send({
        'statusCode': 200,
        'message': feesDetails[i].feesField + ' already configured',
      });
    }
  };

  if (fee_struct == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------> Fees Structure Configuration Failed <---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error',
      'responseBody': {
        'message': 'Failed to configure fees structure.',
        'schoolId': null,
        'status': null
      }
    });
  } else {
    console.log('nmb-school - ' + Date() + ' ---------------| Fees Structure Configured successfully |---------------\n');
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
      'responseBody': {
        'schoolId': schoolId,
      }
    });
  }
  res.end();
});

router.get('/fees-struct/all/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, feesStructureSchool(), [id])
  res.json({
    results
  });
});

router.get('/fees-struct/active/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, feesStructureQuery(), [id])
  res.json({
    results
  });
});

router.put('/fees-struct/:id', async (req, res) => {
  const id = req.params.id;
  const status = req.body.stat;
  const conn = await connection(dbConfig).catch(e => {});
  console.log(status);

  const fee_struct = query(conn, `UPDATE fees_structure SET status = '${status}' WHERE id = ${id}`);

  if (fee_struct != undefined) {
    console.log('nmb-school - ' + Date() + ' ---------------| Fees Structure Update successfully |---------------\n');
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
    });
  }
  res.end();
});

// POST Request - Add New Field
router.post('/field', async (req, res) => {
  const schoolId = req.body.schoolId;
  const field = req.body.field;
  const status = req.body.status;

  const conn = await connection(dbConfig).catch(e => {
    error.log(e)
  });

  const fieldQuery = await query(conn, `INSERT INTO fields_config (school_id, field, status) VALUES (?, ?, ?)`, [schoolId, field, status]);
  if (fieldQuery == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------> FIELD CONFIGURATION FAILED <---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error'
    });
  } else {
    console.log('\nnmb-school - ' + Date() + ' > ---------------| FIELD ADDED SUCCESSFULLY |---------------');
    res.status(201).send({
      'statusCode': 201,
      'message': 'Success',
      'responseBody': {
        'schoolId': schoolId,
        'status': status
      }
    });
  }
  res.end();
});

router.get('/fields', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, 'SELECT * FROM fields_config').catch(console.log);
  res.json({
    results
  });
});



// POST Request - SearchSchool
router.post('/search', async (req, res) => {
  const schoolId = req.body.schoolId;
  const conn = await connection(dbConfig).catch(e => {
    error.log(e)
  });

  const results = await query(conn, `SELECT * FROM school WHERE school_name LIKE '%${schoolId}%'OR school_name LIKE '%${schoolId}%'`);

  if (results == undefined) {
    console.log('\nnmb-school - ' + Date() + ' > ---------------> SCHOOOL SEARCH FAILED <---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'DB Error'
    });
  } else {
    console.log('\n\nmb-school - ' + Date() + ' > --------------| SCHOOLS FOUND |--------------');
    res.json({
      results
    });
  }
  res.end();
});


router.get('/high', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, `SELECT * FROM school WHERE category='High'`).catch(console.log);

  console.log('\n\nmb-school - ' + Date() + ' > --------------| Returned All Schools |--------------');
  res.json({
    results
  });
});

router.get('/primary', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, `SELECT * FROM school WHERE category='Primary'`).catch(console.log);

  console.log('\n\nmb-school - ' + Date() + ' > --------------| Returned All Schools |--------------');
  res.json({
    results
  });
});

router.get('/tertiary', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const results = await query(conn, `SELECT * FROM school WHERE category='Tertiary'`).catch(console.log);

  console.log('\n\nmb-school - ' + Date() + ' > --------------| Returned All Schools |--------------');
  res.json({
    results
  });
});

module.exports = router;