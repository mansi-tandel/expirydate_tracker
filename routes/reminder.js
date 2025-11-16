const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const Reminder = require('../models/Reminder');

const router = express.Router();
let agendaModule;
try {
  agendaModule = require('../worker/agenda');
} catch (e) {
  console.warn('Agenda worker not available in routes:', e.message || e);
  agendaModule = null;
}

const getAgenda = () => (agendaModule && typeof agendaModule.getAgenda === 'function' ? agendaModule.getAgenda() : null);

// Apply auth middleware to all reminder routes
router.use(authMiddleware);

// Multer for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch (e) { console.warn('Failed to create uploads dir', e.message || e); }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

// Clean single image-only Multer config for POST /reminder
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Improved normalization helper
function normalizeNotifyBeforeDays(input) {
  let v = input;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      if (/^\d+$/.test(v)) return [Number(v)];
      return [];
    }
  }
  if (typeof v === 'number') return [v];
  if (!Array.isArray(v)) v = [v];
  // FULLY recursive flattener
  const flattenNums = (arr) => arr.flatMap(el => {
    if (typeof el === 'string') {
      try {
        const parsed = JSON.parse(el);
        return flattenNums(Array.isArray(parsed) ? parsed : [parsed]);
      } catch {
        if (/^\d+$/.test(el)) return [Number(el)];
        return [];
      }
    } else if (typeof el === 'number') {
      return [el];
    } else if (Array.isArray(el)) {
      return flattenNums(el);
    }
    return [];
  });
  v = flattenNums(v).map(Number).filter(x => !isNaN(x) && x >= 0);
  return v;
}

router.post('/', upload.single('image'), [
  body('itemType').trim().notEmpty().withMessage('Item type is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  body('notifyBeforeDays').custom((value, { req }) => {
    const arr = normalizeNotifyBeforeDays(value);
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Notify before days must be a non-empty array of numbers');
    }
    req.body.notifyBeforeDays = arr;
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { itemType, expiryDate, notifyBeforeDays } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
    const reminder = new Reminder({
      userId: req.user._id,
      itemType,
      image: imagePath,
      expiryDate,
      notifyBeforeDays: notifyBeforeDays || [1, 3, 7]
    });
    await reminder.save();
    res.status(201).json({ message: 'Reminder created successfully', reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /reminder - Get all reminders for user
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id })
      .sort({ expiryDate: 1 });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /reminder/search?q=milk - Search reminders by itemType (case-insensitive)
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    const reminders = await Reminder.find({
      userId: req.user._id,
      itemType: { $regex: query, $options: 'i' }
    }).sort({ expiryDate: 1 });

    res.json(reminders);
  } catch (error) {
    console.error('Search reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /reminder/:id - Get specific reminder
router.get('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /reminder/:id - Update reminder
router.put('/:id', upload.single('image'), [
  body('itemType').trim().notEmpty().withMessage('Item type is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  body('notifyBeforeDays').custom((value, { req }) => {
    const arr = normalizeNotifyBeforeDays(value);
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Notify before days must be a non-empty array of numbers');
    }
    req.body.notifyBeforeDays = arr;
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const { itemType, expiryDate, notifyBeforeDays } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    // find existing to check old image
    const existing = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) return res.status(404).json({ message: 'Reminder not found' });

    const update = {
      itemType,
      expiryDate,
      notifyBeforeDays: notifyBeforeDays || [1, 3, 7]
    };
    if (imagePath !== undefined) update.image = imagePath;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    // remove old file if replaced
    if (req.file && existing.image) {
      try {
        const relative = existing.image.replace(/^\/+/, '');
        const oldPath = path.join(__dirname, '..', relative);
        fs.unlink(oldPath, (err) => { if (err) console.warn('Failed to delete old image', err.message || err); });
      } catch (e) {
        console.warn('Failed to resolve old image path', e.message || e);
      }
    }

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // cancel existing jobs related to this reminder and reschedule
    const agPut = getAgenda();
    if (agPut) {
      try {
        await agPut.cancel({ 'data.reminderId': reminder._id.toString() });
      } catch (e) {
        console.warn('Failed to cancel existing jobs for reminder', e.message || e);
      }

      for (const days of reminder.notifyBeforeDays) {
        const notifyDate = new Date(reminder.expiryDate);
        notifyDate.setDate(notifyDate.getDate() - days);
        if (notifyDate > new Date()) {
          await agPut.schedule(notifyDate, 'send-notification', { reminderId: reminder._id, daysBefore: days });
        } else {
          await agPut.now('send-notification', { reminderId: reminder._id, daysBefore: days });
        }
      }
    }

    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /reminder/:id - Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

  if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // remove scheduled jobs
    const agDel = getAgenda();
    if (agDel) {
      try {
        await agDel.cancel({ 'data.reminderId': req.params.id });
      } catch (e) {
        console.warn('Failed to cancel jobs for deleted reminder', e.message || e);
      }
    }

    // remove attachment file if exists
    if (reminder.attachment) {
      try {
        const filePath = path.join(__dirname, '..', reminder.attachment);
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete attachment during reminder delete', e.message || e);
      }
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
