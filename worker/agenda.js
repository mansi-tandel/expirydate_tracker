const Agenda = require('agenda');
const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const mailer = require('../utils/mailer');

const collectionName = process.env.AGENDA_COLLECTION || 'agendaJobs';
let agendaInstance = null;

function defineJobs(ag) {
  if (!ag) return;

  ag.on('error', (err) => console.error('Agenda error event:', err));

  ag.define('send-notification', async (job) => {
    const { reminderId, daysBefore } = job.attrs.data || {};
    try {
      if (!reminderId) return;
      const reminder = await Reminder.findById(reminderId);
      if (!reminder) return;

      const already = (reminder.notificationsSent || []).some(n => n.daysBefore === daysBefore);
      if (already) return;

      const user = await User.findById(reminder.userId).select('-password');
      if (!user || !user.email) return;

      const subject = `Reminder: ${reminder.itemType} will expire in ${daysBefore} day(s)`;
      const text = `Hi ${user.name || ''},\n\nYour item "${reminder.itemType}" is set to expire on ${new Date(reminder.expiryDate).toLocaleDateString()}. This is a reminder ${daysBefore} day(s) before expiry.\n\nRegards,\nExpiry Date Tracker`;

      await mailer.sendMail({ to: user.email, subject, text });

      reminder.notificationsSent = reminder.notificationsSent || [];
      reminder.notificationsSent.push({ daysBefore, sentAt: new Date() });
      await reminder.save();
    } catch (err) {
      console.error('Agenda job error', err);
    }
  });
}

async function startAgenda() {
  try {
    if (agendaInstance) return agendaInstance;

    if (mongoose.connection && mongoose.connection.db) {
      agendaInstance = new Agenda({ mongo: mongoose.connection.db, db: { collection: collectionName } });
      defineJobs(agendaInstance);
      await agendaInstance.start();
      console.log('Agenda started (using mongoose connection)');
      return agendaInstance;
    }

    if (process.env.MONGODB_URI) {
      agendaInstance = new Agenda({ db: { address: process.env.MONGODB_URI, collection: collectionName } });
      defineJobs(agendaInstance);
      await agendaInstance.start();
      console.log('Agenda started (using MONGODB_URI)');
      return agendaInstance;
    }

    mongoose.connection.once('connected', async () => {
      try {
        if (!agendaInstance) {
          agendaInstance = new Agenda({ mongo: mongoose.connection.db, db: { collection: collectionName } });
          defineJobs(agendaInstance);
          await agendaInstance.start();
          console.log('Agenda started after mongoose connection');
        }
      } catch (e) {
        console.error('Failed to start Agenda after mongoose connected:', e);
      }
    });

    return null;
  } catch (e) {
    console.error('startAgenda error', e);
    return null;
  }
}

startAgenda().catch(err => console.error('Agenda initialization failed:', err));

module.exports = {
  getAgenda: () => agendaInstance
};
