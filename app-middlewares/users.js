const express = require('express');
const connection = require('../helpers/connection');
const query = require('../helpers/query');
const router = express.Router();
const dbConfig = require('../dbConfig');
const Cryptr = require('cryptr');

const cryptr = new Cryptr('Nmb-sx00l-F345-g4t38a6');

router.post('/user', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => { });
  const idNumber = req.body.idNumber;
  const title = req.body.title;
  const firstName = req.body.firstName;
  const surname = req.body.surname;
  const emailAddress = req.body.emailAddress;
  const phoneNumber = req.body.phoneNumber;
  const schoolId = req.body.schoolId;
  const role = req.body.role;
  const createdBy = req.body.createdBy;
  const initialPassword = '@pass' + Math.floor(Math.random() * 10000);
  const passwordReset = 1;
  const password = cryptr.encrypt(initialPassword);

  const checkUser = await query(conn, `SELECT * FROM school_user WHERE id_number = '${idNumber}' OR email_address = '${emailAddress}' OR phone_number='${phoneNumber}'`);

  if (checkUser.length == 0) {
    const schoolAppearence = await query(conn, `SELECT * FROM school WHERE school_id = '${schoolId}'`);
    if (schoolAppearence.length > 0) {
      const user = await query(conn, `INSERT INTO school_user (id_number, title, first_name, surname, email_address, phone_number, school_id, role, created_by) VALUES (?,?,?,?,?,?,?,?,?)`, [idNumber, title, firstName, surname, emailAddress, phoneNumber, schoolId, role, createdBy]);
      if (user == undefined) {
        console.log('\nnmb-school - ' + Date() + ' > ---------------| USER CREATION FAILED |---------------');
        const school = await query(conn, `DELETE FROM school WHERE school_id = '${schoolId}'`);
        if (school != undefined) {
          console.log('nmb-school - ' + Date() + ' > --------------------------| School Deleted |----------------');
          res.status(200).send({
            'statusCode': 500,
            'message': 'DB Error',
            'responseBody': {
              'message': 'Failed to create user for school: ' + schoolId,
              'schoolId': null,
              'status': null
            }
          });
          res.end();
        }
      } else {
        const userCred = await query(conn, `INSERT INTO school_login (id_number,password, password_reset, role, school_id) VALUES (?,?,?,?,?)`, [idNumber, password, passwordReset, role, schoolId]);
        if (userCred == undefined) {
          console.log('\nnmb-school - ' + Date() + ' > ---------------> USER CREATION FAILED <---------------');
          const school = await query(conn, `DELETE FROM school_user WHERE id_number = '${idNumber}'`);
          if (school != undefined) {
            res.status(200).send({
              'statusCode': 500,
              'message': 'DB Error',
              'responseBody': {
                'message': 'Failed to create user for school: ' + schoolId + '. Kindly try adding the school again.',
                'schoolId': null,
                'status': null
              }
            });
          }
          res.end();
        } else {
          console.log('\n\n---------------| USER CREATED, SENDING EMAIL WITH ACCESS CREDENTIALS|---------------');
          console.log('nmb-school - ' + Date() + ' > [ id: ' + idNumber + ': ' + firstName + ' ' + surname + ' password: ' + initialPassword + ' ]');
        }
      }
    } else {
      res.status(200).send({
        'statusCode': 200,
        'message': 'School Doesnt Exist',
        'responseBody': {
          'message': 'School with id: ' + schoolId + ' does not exist'
        }
      });
    }
    res.end();
  } else {
    console.log('\nnmb-school - ' + Date() + ' > --------------|User already exist: \n' + JSON.stringify(checkUser) + ' |---------------');
    res.status(200).send({
      'statusCode': 500,
      'message': 'Duplicate Entry',
      'responseBody': {
        'schoolId': 'User with those details already exists.'
      }
    });
  }
  res.end();
});

// Get all users
router.get('/users', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => { });
  const results = await query(conn, 'SELECT * FROM school_user').catch(console.log);
  console.log('\nnmb-school - ' + Date() + ' > --------------| Returned All School Users |---------------');
  res.json({
    results
  });

});

// Get all users for a particular school with school_id :id
router.get('/school-users/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await connection(dbConfig).catch(e => { });
  const results = await query(conn, `SELECT * FROM school_user WHERE school_id='${id}'`).catch(console.log);
  console.log('\nnmb-school - ' + Date() + ' > --------------| Returned Users from school: ' + id + ' |---------------');
  res.json({
    results
  });
});


module.exports = router;