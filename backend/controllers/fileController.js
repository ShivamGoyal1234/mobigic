const File = require('../models/File');
const { generateCode } = require('../utils/codeGenerator');
const fs = require('fs');

const uploadFile = async (req, res) => {
  const code = generateCode();
  const file = new File({
    filename: req.file.filename,
    path: req.file.path,
    code: code,
    user: req.userId,
  });
  await file.save();
  res.json({ code });
};

const getUserFiles = async (req, res) => {
  const files = await File.find({ user: req.userId });
  res.json(files);
};

const deleteFile = async (req, res) => {
  const file = await File.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (file) {
    fs.unlinkSync(file.path);
    res.send('File deleted');
  } else {
    res.status(404).send('File not found');
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');

    if (!file.path) return res.status(400).send('Invalid file path');
    
    res.download(file.path, (err) => {
      if (err) {
        return res.status(500).send('Error downloading file');
      }
    });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const verifyCode = async (req, res) => {
  try {
    const { code } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');
    
    if (file.code !== code) {
      return res.status(401).send('Invalid code');
    }

    res.send('Code verified');
  } catch (error) {
    res.status(500).send('Server error');
  }
};


module.exports = { uploadFile, getUserFiles, deleteFile, downloadFile, verifyCode };