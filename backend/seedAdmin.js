/**
 * Run once: node seedAdmin.js
 * Creates admin Firebase Auth accounts and Firestore docs.
 */
require('dotenv').config();
const { admin, db, auth } = require('./firebase');

const admins = [
  { email: 'admin@stjosephs.ac.in', password: 'admin123', name: 'Placement Coordinator', role: 'coordinator' },
  { email: 'faculty@stjosephs.ac.in', password: 'faculty123', name: 'Department Faculty', role: 'faculty' },
];

async function seed() {
  for (const a of admins) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(a.email);
        console.log(`Admin already exists: ${a.email}`);
      } catch {
        userRecord = await auth.createUser({ email: a.email, password: a.password, displayName: a.name });
        console.log(`Created auth user: ${a.email}`);
      }
      await db.collection('admins').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: a.email,
        name: a.name,
        role: a.role,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`Firestore doc set for: ${a.email}`);
    } catch (err) {
      console.error(`Error seeding ${a.email}:`, err.message);
    }
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed();
