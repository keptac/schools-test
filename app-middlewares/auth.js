const express = require('express');
const randtoken = require('rand-token');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const Cryptr = require('cryptr');

const connection = require('../helpers/connection');
const query = require('../helpers/query');
const dbConfig = require('../dbConfig');

const cryptr = new Cryptr('Nmb-sx00l-F345-g4t38a6');
const refreshTokens = {};
const SECRET = 'VERY_SECRET_KEY!';
const passportOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET
};

const router = express.Router();

passport.use(new JwtStrategy(passportOpts, function (jwtPayload, done) {
  const expirationDate = new Date(jwtPayload.exp * 1000);
  if (expirationDate < new Date()) {
    return done(null, false);
  }
  done(null, jwtPayload);
}));

passport.serializeUser(function (user, done) {
  done(null, user.username)
});

router.put('/password-reset', async (req, res) => {
  const username = req.body.username;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const password = cryptr.encrypt(newPassword);

  const conn = await connection(dbConfig).catch(e => {});

  const results = await query(conn, `SELECT * FROM school_login WHERE id_number = '${username}'`).catch(console.log);
  if (results.length > 0) {

    if (cryptr.decrypt(results[0].password) == oldPassword) {
    
      const reset = query(conn, `UPDATE school_login SET password = '${password}', password_reset = '0' WHERE id_number = '${username}'`).catch(console.log);;
      if (reset != undefined) {
        res.status(201).send({
          'statusCode': 201,
          'responseBody': {
            'message': 'Success',
          }
        });
      } else {
        res.status(200).send({
          'statusCode': 200,
          'responseBody': {
            'message': 'Failed to change passowrd. Please try again later.',
          }
        });
      }
    } else {
      res.send({
        'statusCode': 401,
        'responseBody': {
          'message': 'Invalid credentials.',
        }
      });
    }
  }else{
    res.send({
      'statusCode': 401,
      'responseBody': {
        'message': 'User account not found.',
      }
    });
  }




  res.end();
});


router.post('/login', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});
  const route = req.body.route;
  const username = req.body.username;
  const password = req.body.password;
  const refreshToken = randtoken.uid(256);

  if (route == 'school') {
    console.log(route);
    const results = await query(conn, `SELECT * FROM school_login WHERE id_number = '${username}'`).catch(console.log);
    if (results.length > 0) {
      console.log(cryptr.decrypt(results[0].password));
      console.log(password);
      if (cryptr.decrypt(results[0].password) == password) {
        const userDet = await query(conn, `SELECT * FROM school_user WHERE id_number = '${username}'`).catch(console.log);
        const fullDet = userDet[0].first_name + ' ' + userDet[0].surname;
        const photo = await query(conn, `SELECT * FROM school WHERE school_id = '${userDet[0].school_id}'`).catch(console.log);

        const user = {
          'fullName': fullDet,
          'role': userDet[0].role,
          'school': userDet[0].school_id
        };

        const token = jwt.sign(user, SECRET, {
          expiresIn: 10
        });

        refreshTokens[refreshToken] = username;

        if (results[0].password_reset == '1') {
          res.status(200).send({
            'statusCode': 200,
            'responseBody': {
              'message': 'Password Reset Required',
              'username': username
            }
          });
          res.end();
        } else {
          res.status(201).json({
            'statusCode': 201,
            'responseBody': {
              'message': 'Success',
              'username': username,
              'fullName': fullDet,
              'role': userDet[0].role,
              'schoolId': userDet[0].school_id,
              'logo_url': photo[0].logo_url,
              'schoolName': photo[0].school_name,
              'jwt': token,
              'refreshToken': refreshToken
            }
          });
          res.end();
        }
      } else {
        res.send({
          'statusCode': 401,
          'responseBody': {
            'message': 'Incorrect Credentials',
          }
        });
        res.end();
      }
    } else {
      res.send({
        'statusCode': 401,
        'responseBody': {
          'message': 'User account not found.'
        }
      });
    }
  } else {
    const results = await query(conn, `SELECT * FROM nmb_login WHERE username = '${username}'`).catch(console.log);
    if (results.length > 0) {
      if (cryptr.decrypt(results[0].password) == password) {
        const userDet = await query(conn, `SELECT * FROM nmb_login WHERE username = '${username}'`).catch(console.log);

        const user = {
          'fullName': userDet[0].username,
          'role': userDet[0].role,
        };

        const token = jwt.sign(user, SECRET, {
          expiresIn: 10
        });

        refreshTokens[refreshToken] = username;

        if (results[0].password_reset == '1') {
          res.status(201).send({
            'statusCode': 201,
            'responseBody': {
              'message': 'Reset Password'
            }
          });
          res.end();
        } else {
          res.status(201).json({
            'statusCode': 201,
            'responseBody': {
              'message': 'Success',
              'username': username,
              'fullName': username,
              'role': userDet[0].role,
              'jwt': token,
              'refreshToken': refreshToken
            }
          });
          res.end();
        }
      } else {
        res.status(401).send({
          'statusCode': 401,
          'responseBody': {
            'message': 'Incorrect Credentials.',
          }

        });
        res.end();
      }
    } else {
      res.status(401).send({
        'statusCode': 401,
        'responseBody': {
          'message': 'User account not found.'
        }
      });
    }
  }
});

router.post('/logout', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    delete refreshTokens[refreshToken];
  }
  res.sendStatus(204);
});



router.post('/refresh', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    const user = {
      'username': refreshTokens[refreshToken],
      'role': 'admin'
    }
    const token = jwt.sign(user, SECRET, {
      expiresIn: 600
    });
    res.json({
      jwt: token
    })
  } else {
    res.sendStatus(401);
  }
});


router.get('/random', passport.authenticate('jwt'), function (req, res) {
  res.json({
    value: Math.floor(Math.random() * 100)
  });
});



module.exports = router;