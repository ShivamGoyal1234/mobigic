const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadFile, getUserFiles, deleteFile, downloadFile, verifyCode } = require('../controllers/fileController');

router.post('/upload', verifyToken, upload.single('file'), uploadFile);
router.get('/files', verifyToken, getUserFiles);
router.delete('/files/:id', verifyToken, deleteFile);
router.get('/files/download/:id', downloadFile);
router.post('/files/verify-code/:id', verifyCode);

module.exports = router;