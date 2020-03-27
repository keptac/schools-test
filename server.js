const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const multer = require('multer');
const randtoken = require('rand-token');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const connection = require('./helpers/connection');
const query = require('./helpers/query');
var cors = require('cors');
const dashRouter = require('./app-middlewares/dash');
const schoolsRouter = require('./app-middlewares/schools');
const usersRouter = require('./app-middlewares/users');
const paymentsRouter = require('./app-middlewares/payments/payments');
const ecocashRouter = require('./app-middlewares/payments/ecocash');
const cashRouter = require('./app-middlewares/payments/manualPayment');
const internalTransfereRouter = require('./app-middlewares/payments/internalTransfere');
const manualPaymentRouter = require('./app-middlewares/payments/manualPayment');
// const uploadFilesRouter = require('./app-middlewares/upload');
const emailRouter = require('./app-middlewares/email');
const dbConfig = require('./dbConfig');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('Nmb-sx00l-F345-g4t38a6');

const app = express();

const refreshTokens = {};
const SECRET = 'VERY_SECRET_KEY!';
const passportOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET
};
const port = 4000;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

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

app.post('/api/auth/login', async (req, res) => {
  const conn = await connection(dbConfig).catch(e => {});

  const route = req.body.route;
  const username = req.body.username;
  const password = req.body.password;
  const refreshToken = randtoken.uid(256);

  if (route == 'school') {
    console.log(route);
    const results = await query(conn, `SELECT * FROM SCHOOL_LOGIN WHERE id_number = '${username}'`).catch(console.log);
    if (results.length > 0) {
      if (cryptr.decrypt(results[0].password) == password) {
        const userDet = await query(conn, `SELECT * FROM SCHOOL_USER WHERE id_number = '${username}'`).catch(console.log);
        const fullDet = userDet[0].first_name + ' ' + userDet[0].surname;
        const photo = await query(conn, `SELECT * FROM SCHOOL WHERE school_id = '${userDet[0].school_id}'`).catch(console.log);

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
          res.status(201).send({
            'statusCode': 201,
            'message': 'Success',
            'responseBody': {
              'message': 'Reset Password',
              'username': username
            }
          });
          res.end();
        } else {
          res.status(201).json({
            'statusCode': 201,
            'message': 'Success',
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
        res.status(401).send({
          'statusCode': 401,
          'message': 'Incorrect Credentials',
        });
        res.end();
      }
    } else {
      res.status(200).send({
        'statusCode': 200,
        'message': 'Success',
        'responseBody': {
          'message': 'User doesnt exist'
        }
      });
    }
  } else {
    console.log(route);
    const results = await query(conn, `SELECT * FROM NMB_LOGIN WHERE username = '${username}'`).catch(console.log);
    if (results.length > 0) {
      if (cryptr.decrypt(results[0].password) == password) {
        const userDet = await query(conn, `SELECT * FROM NMB_LOGIN WHERE username = '${username}'`).catch(console.log);

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
            'message': 'Success',
            'responseBody': {
              'message': 'Reset Password',
              'username': username
            }
          });
          res.end();
        } else {
          res.status(201).json({
            'statusCode': 201,
            'message': 'Success',
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
          'message': 'Incorrect Credentials',
        });
        res.end();
      }
    } else {
      res.status(200).send({
        'statusCode': 200,
        'message': 'Success',
        'responseBody': {
          'message': 'User doesnt exist'
        }
      });
    }
  }
});

app.post('/logout', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    delete refreshTokens[refreshToken];
  }
  res.sendStatus(204);
});

app.post('/refresh', function (req, res) {
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

app.get('/random', passport.authenticate('jwt'), function (req, res) {
  res.json({
    value: Math.floor(Math.random() * 100)
  });
});




// File upload settings  
const PATH = 'C:/Users/admin/Desktop/NMB/school-fees-payment-direct-backend/uploads';
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
let upload = multer({
  storage: storage
});

// POST File
app.post('/api/nmb/upload/logo', upload.single('logo'), function (req, res) {
  if (!req.file) {
    console.log("No file is available!");
    return res.send({
      success: false
    });
  } else {
    console.log('logo is uploaded!');
    return res.status(201).send({
      success: true,
      fileLocation: `${req.file.destination}/${req.file.filename}.png`
    })
  }
});

app.get('/', (req, res) => res.send('Welcome to NMB School Fees Payments Gateway ENDPOINT'));
app.use('/api/nmb', dashRouter);
app.use('/api/nmb/schools', schoolsRouter);
app.use('/api/nmb/users', usersRouter);
app.use('/api/nmb/email', emailRouter);
app.use('/api/nmb/payments', paymentsRouter);
app.use('/api/nmb/ecocash', ecocashRouter);
app.use('/api/nmb/cash', cashRouter);
app.use('/api/nmb/internal', internalTransfereRouter);
app.use('/api/nmb/manual', manualPaymentRouter);
// app.use('/api/nmb/upload', uploadFilesRouter);

app.listen(port, () => console.log(`School fees app listening on port ${port}!`));