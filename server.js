const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const https = require('https');
const fs = require('fs');

const Cryptr = require('cryptr');

const cryptr = new Cryptr('Nmb-sx00l-F345-g4t38a6');

const schoolsRouter = require('./app-middlewares/schools');
const usersRouter = require('./app-middlewares/users');
const authRouter = require('./app-middlewares/auth');
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

app.get('', (req, res) => {
  console.log(cryptr.decrypt('5d823fb48082625bc86f534e10dd7c30fe9aedc981720c8ec4f24c64aa69aef46e32569961673115fd70522c4826f3227964da0ee5362b9c924a950417dd4610ad889e8d05fed6f3f8677d393d9a04b23122fbda308a6c6be24c772f4b6fafd871bd82685696d9'));

   console.log("Schools Connected"); res.send('Welcome to NMBZ School Fees Payments Gateway')});
app.use('/api/auth', authRouter);
app.use('/api/nmb/schools', schoolsRouter);
app.use('/api/nmb/users', usersRouter);
// app.use('/api/nmb/upload', uploadFilesRouter);

const options = {
  key: fs.readFileSync('./certs/nmbconnectonline.co.zw.key'),
  cert: fs.readFileSync('./certs/nmbconnectonline_co_zw.pem')
};

https.createServer(options, app).listen(port);
