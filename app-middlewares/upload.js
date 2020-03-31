// const multer = require('multer');
// const express = require('express');
// const router = express.Router();

// const PATH = '../uploads';

// let storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, PATH);
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname + '-' + Date.now())
//     }
// });

// let upload = multer({
//     storage: storage
// });

// // POST File
// router.post('/logo', upload.single('logo'), function (req, res) {
//     if (!req.file) {
//         console.log("No file is available!");
//         return res.send({
//             success: false
//         });
//     } else {
//         console.log(req.file);
//         console.log('File is available!');
//         return res.send({
//             success: true
//         })
//     }
// });