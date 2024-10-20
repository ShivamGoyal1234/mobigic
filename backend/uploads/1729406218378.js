// controllers/fileController.js
const File = require('../models/File');
const crypto = require('crypto');
const path = require('path');

// ... other controller functions ...

const verifyCode = async (req, res) => {
  try {
    const { code } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).send('File not found');
    }
    if (file.code !== code) {
      return res.status(401).send('Invalid code');
    }

    // Generate a temporary download token
    const downloadToken = crypto.randomBytes(16).toString('hex');
    file.downloadToken = downloadToken;
    file.downloadTokenExpires = Date.now() + 5 * 60 * 1000; // Token expires in 5 minutes
    await file.save();

    // Return the download URL with the token
    const downloadUrl = `/files/download/${file._id}?token=${downloadToken}`;
    res.json({ downloadUrl });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Server error');
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).send('File not found');
    }

    // Check if the download token is valid and not expired
    if (file.downloadToken !== req.query.token || Date.now() > file.downloadTokenExpires) {
      return res.status(401).send('Invalid or expired download link');
    }

    const filePath = path.join(__dirname, '..', file.path);
    res.download(filePath, file.filename, (err) => {
      if (err) {
        res.status(500).send('Error downloading file');
      }
    });

    // Clear the download token after use
    file.downloadToken = undefined;
    file.downloadTokenExpires = undefined;
    await file.save();
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).send('Server error');
  }
};

module.exports = { 
  // ... other exports ...
  verifyCode,
  downloadFile
};
