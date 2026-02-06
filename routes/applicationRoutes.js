const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const { protect, admin } = require('../middleware/authMiddleware');

// Configure Multer for PDF/Doc upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const checkFileType = (file, cb) => {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: PDFs and Docs Only!');
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @desc    Submit a new job application
// @route   POST /api/applications
// @access  Public
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { fullName, email, position } = req.body;
    const resume = req.file ? req.file.path : null;

    if (!resume) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const application = await Application.create({
      fullName,
      email,
      position,
      resume,
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const applications = await Application.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (application) {
      application.status = status || application.status;
      const updatedApplication = await application.save();
      res.json(updatedApplication);
    } else {
      res.status(404).json({ message: 'Application not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (application) {
      // Delete file from filesystem
      if (application.resume) {
        const filePath = path.join(__dirname, '..', application.resume);
        
        // Attempt to delete file
        fs.unlink(filePath, (err) => {
          if (err) {
            // Log error but proceed with DB deletion (e.g. file might already be missing)
            console.error(`Failed to delete local file at ${filePath}:`, err);
          }
        });
      }

      await application.deleteOne(); 
      res.json({ message: 'Application removed' });
    } else {
      res.status(404).json({ message: 'Application not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;