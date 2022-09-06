const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const https = require('https');
const fs = require('fs');

const schoolsRouter = require('./app-middlewares/schools');
const usersRouter = require('./app-middlewares/users');
const paymentsRouter = require('./app-middlewares/payments/payments');
const ecocashRouter = require('./app-middlewares/payments/ecocash');
const cashRouter = require('./app-middlewares/payments/manualPayment');
const internalTransferRouter = require('./app-middlewares/payments/internalTransfer');
const zipitRouter = require('./app-middlewares/payments/zipit');
const manualPaymentRouter = require('./app-middlewares/payments/manualPayment');
const authRouter = require('./app-middlewares/auth');
const emailRouter = require('./app-middlewares/email');
const port = 8888;
const app = express();

var cors = require('cors');
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

const PATH = '../school-fees/assets/images/school-logos'

// let storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, PATH);
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// });
// let upload = multer({
//   storage: storage
// });

// POST File
// app.post('/api/nmb/upload/logo', upload.single('logo'), function (req, res) {
//   if (!req.file) {
//     console.log("No file is available!");
//     return res.send({
//       success: false
//     });
//   } else {
//     console.log('logo is uploaded!');
//     return res.status(201).send({
//       success: true,
//       fileLocation: `/assets/images/school-logos/${req.file.filename}`
//     })
//   }
// });

app.get('', (req, res) => { console.log("Schools Connected"); res.send('Welcome to NMBZ School Fees Payments Gateway')});
app.use('/api/auth', authRouter);
app.use('/api/nmb/schools', schoolsRouter);
app.use('/api/nmb/users', usersRouter);
app.use('/api/nmb/email', emailRouter);
app.use('/api/nmb/payments', paymentsRouter);
app.use('/api/nmb/ecocash', ecocashRouter);
app.use('/api/nmb/cash', cashRouter);
app.use('/api/nmb/internal', internalTransferRouter);
app.use('/api/nmb/zipit', zipitRouter);
app.use('/api/nmb/manual', manualPaymentRouter);
// app.use('/api/nmb/upload', uploadFilesRouter);

const options = {
  key: fs.readFileSync('./certs/nmbconnectonline.co.zw.key'),
  cert: fs.readFileSync('./certs/nmbconnectonline_co_zw.pem')
};

https.createServer(options, app).listen(port);
