const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Application = require('../models/Application');
const { protect, admin } = require('../middleware/authMiddleware');
const { storage, cloudinary } = require('../config/cloudinary');

// Configure Multer with Cloudinary Storage
const checkFileType = (file, cb) => {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Mimetype check can be tricky with some docx files, relying primarily on extension for this example
  // or add complex mimetype map. For now, strict extension check + generic mimetype check.
  const mimetype = filetypes.test(file.mimetype) || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.mimetype === 'application/msword';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: PDFs and Docs Only!');
  }
};

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Submit a new job application
// @route   POST /api/applications
// @access  Public
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { fullName, email, position } = req.body;
    
    // With Cloudinary storage, req.file.path is the secure URL
    // req.file.filename is the public_id
    const resume = req.file ? req.file.path : null;
    const resumePublicId = req.file ? req.file.filename : null;

    if (!resume) {
      return res.status(400).json({ message: 'Resume file is required or invalid format' });
    }

    const application = await Application.create({
      fullName,
      email,
      position,
      resume,
      resumePublicId,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(400).json({ message: error.message || 'File upload failed' });
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
      // Delete file from Cloudinary if public_id exists
      if (application.resumePublicId) {
        try {
          // Detect resource type based on public_id or stored data
          // Usually 'raw' for docs, 'image' for pdfs (if auto was used and it became an image type)
          // To be safe, try deleting as generic or handle specific types if needed.
          // For 'auto' uploads, we often need to know the type. However, cloudinary.uploader.destroy 
          // defaults to 'image'. If it was saved as raw (doc/docx), we need { resource_type: 'raw' }
          
          const isRaw = application.resume.endsWith('.doc') || application.resume.endsWith('.docx');
          const resourceType = isRaw ? 'raw' : 'image'; // PDF is often treated as image resource in Cloudinary unless specified raw

          await cloudinary.uploader.destroy(application.resumePublicId, { resource_type: resourceType });
        } catch (cloudError) {
          console.error(`Failed to delete Cloudinary file: ${cloudError.message}`);
        }
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