const mongoose = require('mongoose');
const Event = require('./models/Event');
const VolunteerTask = require('./models/VolunteerTask');
const Attendance = require('./models/Attendance');

mongoose.connect('mongodb://127.0.0.1:27017/event-management');

async function syncTasks() {
  const events = await Event.find({});
  let count = 0;
  for (const event of events) {
    if (event.assignedVolunteers && event.assignedVolunteers.length > 0) {
      for (const volId of event.assignedVolunteers) {
        // check if task exists
        const exists = await VolunteerTask.findOne({ volunteer: volId, event: event._id });
        if (!exists) {
          await VolunteerTask.create({
            volunteer: volId,
            event: event._id,
            taskName: 'Event Support',
            description: `Support role for ${event.title}`,
            dueDate: event.date ? new Date(event.date) : new Date(),
            salary: 200,
            status: 'pending'
          });
          
          const attExists = await Attendance.findOne({ volunteer: volId, event: event._id });
          if(!attExists){
             await Attendance.create({
                volunteer: volId,
                event: event._id,
                status: 'pending'
             });
          }
          count++;
          console.log(`Created missing task for volunteer ${volId} on event ${event.title}`);
        }
      }
    }
  }
  console.log(`Done. Synced ${count} missing tasks.`);
  process.exit(0);
}

syncTasks();
