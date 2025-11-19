const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

async function processRemindersForToday() {
  const today = toDateOnly(new Date());
  const reminders = await Reminder.find({});

  for (const reminder of reminders) {
    try {
      if (!reminder.expiryDate) continue;

      const expiryDateOnly = toDateOnly(reminder.expiryDate);
      const notifyDaysList = Array.isArray(reminder.notifyBeforeDays)
        ? reminder.notifyBeforeDays
        : [];

      for (const daysBeforeRaw of notifyDaysList) {
        const daysBefore = Number(daysBeforeRaw);
        if (!Number.isFinite(daysBefore)) continue;

        const notificationDate = new Date(expiryDateOnly);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);

        if (!isSameDate(notificationDate, today)) continue;

        const alreadySent = (reminder.notificationsSent || []).some((n) => {
          const sentAtDateOnly = n?.sentAt ? toDateOnly(n.sentAt) : null;
          return n?.daysBefore === daysBefore && sentAtDateOnly && isSameDate(sentAtDateOnly, today);
        });
        if (alreadySent) continue;

        const user = await User.findById(reminder.userId).select('-password');
        if (!user || !user.email) continue;

        const subject = `Reminder: ${reminder.itemType} expires on ${expiryDateOnly.toLocaleDateString()}`;
        const text = `Hi ${user.name || ''},\n\nYour item "${reminder.itemType}" is set to expire on ${expiryDateOnly.toLocaleDateString()}. This is your ${daysBefore}-day reminder.\n\nRegards,\nExpiry Date Tracker`;
        const html = `<p>Hi ${user.name || ''},</p><p>Your item "${reminder.itemType}" is set to expire on <strong>${expiryDateOnly.toLocaleDateString()}</strong>. This is your <strong>${daysBefore}-day</strong> reminder.</p><p>Regards,<br/>Expiry Date Tracker</p>`;

        try {
          await sendMail({ to: user.email, subject, text, html });
          reminder.notificationsSent = reminder.notificationsSent || [];
          reminder.notificationsSent.push({ daysBefore, sentAt: new Date() });
          await reminder.save();
          console.log(`Reminder email sent for reminder ${reminder._id} (${daysBefore}d before) to ${user.email}`);
        } catch (e) {
          console.error('Failed to send reminder email', {
            reminderId: String(reminder._id),
            userId: String(reminder.userId),
            error: e && (e.message || e)
          });
        }
      }
    } catch (err) {
      console.error('Error processing reminder', {
        reminderId: String(reminder?._id || ''),
        error: err && (err.message || err)
      });
    }
  }
}

const cronExpression = '0 9 * * *';
const timezone = process.env.CRON_TZ || undefined; 

try {
  cron.schedule(
    cronExpression,
    () => {
      console.log('Cron: Starting daily reminder processing at 09:00');
      processRemindersForToday().catch((e) => console.error('Cron processing failed', e));
    },
    { timezone }
  );
  console.log(`Cron scheduled: ${cronExpression}${timezone ? ' TZ=' + timezone : ''}`);
} catch (e) {
  console.error('Failed to schedule cron job', e && (e.message || e));
}

if (process.env.RUN_CRON_IMMEDIATELY === 'true') {
  processRemindersForToday().catch((e) => console.error('Immediate cron run failed', e));
}

module.exports = { processRemindersForToday };


