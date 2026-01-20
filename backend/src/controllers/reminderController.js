import Reminder from '../models/Reminder.js';
import ReminderType from '../models/ReminderType.js';

// Helpers
const utcStartOfDay = (d) => {
  const dt = new Date(d);
  dt.setUTCHours(0,0,0,0);
  return dt;
};

const addMonths = (date, months) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()))
  const newMonth = d.getUTCMonth() + months;
  d.setUTCMonth(newMonth);
  // If month overflow causes date to jump (e.g., Feb 30 -> Mar 2), detect and return null to skip
  if (d.getUTCDate() !== date.getUTCDate()) return null;
  return d;
};

const addYears = (date, years) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()))
  d.setUTCFullYear(d.getUTCFullYear() + years);
  if (d.getUTCMonth() !== date.getUTCMonth() || d.getUTCDate() !== date.getUTCDate()) return null;
  return d;
};

// Generate occurrence dates for a reminder within range [from, to]
const generateOccurrences = (reminder, from, to) => {
  const occurrences = [];
  const base = new Date(reminder.occurrenceDate);
  const repeat = reminder.repeat || { kind: 'single', interval: 1 };

  if (repeat.kind === 'single') {
    if (base >= from && base <= to && !reminder.archived) occurrences.push(new Date(base));
    return occurrences;
  }

  // For monthly/yearly repeats, iterate forward from anchor until > to or until end
  let cursor = new Date(base);
  // If base is before range start, advance to the first >= from
  if (cursor < from) {
    if (repeat.kind === 'monthly') {
      const monthDiff = (from.getUTCFullYear() - cursor.getUTCFullYear()) * 12 + (from.getUTCMonth() - cursor.getUTCMonth());
      const jump = Math.floor(monthDiff / repeat.interval) * repeat.interval;
      cursor = addMonths(cursor, jump) || cursor;
      while (cursor < from) {
        cursor = addMonths(cursor, repeat.interval);
        if (!cursor) break;
      }
    } else if (repeat.kind === 'yearly') {
      const yearDiff = from.getUTCFullYear() - cursor.getUTCFullYear();
      const jump = Math.floor(yearDiff / repeat.interval) * repeat.interval;
      cursor = addYears(cursor, jump) || cursor;
      while (cursor < from) {
        cursor = addYears(cursor, repeat.interval);
        if (!cursor) break;
      }
    }
  }

  while (cursor && cursor <= to) {
    if (reminder.archived) break;
    if (repeat.until && cursor > new Date(repeat.until)) break;
    occurrences.push(new Date(cursor));
    if (repeat.kind === 'monthly') {
      cursor = addMonths(cursor, repeat.interval);
    } else if (repeat.kind === 'yearly') {
      cursor = addYears(cursor, repeat.interval);
    } else break;
  }

  return occurrences;
};

export const getReminders = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { userId: req.user._id };

    // fetch raw reminders and populate type
    const reminders = await Reminder.find(query).lean();
    const typeIds = reminders.map(r => r.typeId).filter(Boolean);
    const types = await ReminderType.find({ _id: { $in: typeIds } }).lean();
    const typeMap = {};
    types.forEach(t => typeMap[String(t._id)] = t);

    if (from || to) {
      const fromDate = from ? new Date(from) : new Date();
      const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 1000 * 60 * 60 * 24 * 30); // default 30 days

      const occurrences = [];
      reminders.forEach(r => {
        const occs = generateOccurrences(r, fromDate, toDate);
        occs.forEach(o => {
          const type = r.typeId ? typeMap[String(r.typeId)] : null;
          occurrences.push({
            reminderId: r._id,
            title: r.title,
            description: r.description,
            occurrenceDate: o,
            repeat: r.repeat,
            color: r.color || (type ? type.color : '#10B981'),
            type: type ? { _id: type._id, name: type.name, color: type.color } : null
          });
        });
      });

      // sort by date
      occurrences.sort((a,b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate));
      return res.json({ occurrences });
    }

    // No range requested - return reminders with nextOccurrence computed
    const now = new Date();
    const nextList = reminders.map(r => {
      const type = r.typeId ? typeMap[String(r.typeId)] : null;
      // compute next occurrence >= now
      let next = null;
      const occs = generateOccurrences(r, now, new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365)); // search 1 year forward
      if (occs && occs.length) next = occs[0];
      return {
        ...r,
        nextOccurrence: next,
        color: r.color || (type ? type.color : '#10B981'),
        type: type ? { _id: type._id, name: type.name, color: type.color } : null
      };
    });

    res.json({ reminders: nextList });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.message });
  }
};

export const createReminder = async (req, res) => {
  try {
    const { title, description, occurrenceDate, repeat, typeId, color } = req.body;
    if (!title || !occurrenceDate) return res.status(400).json({ message: 'title and occurrenceDate are required' });

    const reminder = new Reminder({
      userId: req.user._id,
      title,
      description: description || '',
      occurrenceDate: new Date(occurrenceDate),
      repeat: repeat || { kind: 'single', interval: 1 },
      typeId: typeId || null,
      color: color || null
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Error creating reminder', error: error.message });
  }
};

export const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    if (reminder.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    const { title, description, occurrenceDate, repeat, typeId, color, archived } = req.body;
    if (title) reminder.title = title;
    if (description !== undefined) reminder.description = description;
    if (occurrenceDate) reminder.occurrenceDate = new Date(occurrenceDate);
    if (repeat) reminder.repeat = repeat;
    if (typeId !== undefined) reminder.typeId = typeId;
    if (color !== undefined) reminder.color = color;
    if (archived !== undefined) reminder.archived = archived;

    reminder.updatedAt = new Date();
    await reminder.save();
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Error updating reminder', error: error.message });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    if (reminder.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    // soft-delete
    reminder.archived = true;
    await reminder.save();
    res.json({ message: 'Reminder archived' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Error deleting reminder', error: error.message });
  }
};

// Reminder types
export const getReminderTypes = async (req, res) => {
  try {
    const types = await ReminderType.find({ userId: req.user._id }).lean();
    res.json({ types });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ message: 'Error fetching types', error: error.message });
  }
};

export const createReminderType = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const type = new ReminderType({ userId: req.user._id, name, color: color || '#10B981' });
    await type.save();
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating type:', error);
    res.status(500).json({ message: 'Error creating type', error: error.message });
  }
};

export const updateReminderType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await ReminderType.findById(id);
    if (!type) return res.status(404).json({ message: 'Type not found' });
    if (type.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    const { name, color } = req.body;
    if (name) type.name = name;
    if (color) type.color = color;
    await type.save();
    res.json(type);
  } catch (error) {
    console.error('Error updating type:', error);
    res.status(500).json({ message: 'Error updating type', error: error.message });
  }
};

export const deleteReminderType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await ReminderType.findById(id);
    if (!type) return res.status(404).json({ message: 'Type not found' });
    if (type.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    // set typeId to null on linked reminders
    await Reminder.updateMany({ typeId: id }, { $set: { typeId: null } });
    await type.deleteOne();

    res.json({ message: 'Type deleted' });
  } catch (error) {
    console.error('Error deleting type:', error);
    res.status(500).json({ message: 'Error deleting type', error: error.message });
  }
};
