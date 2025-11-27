/*
 * LifeLink Database Seeder
 * Usage: node scripts/seed.js
 *
 * This script will:
 * 1. Connect to MongoDB.
 * 2. Clear existing Donor and Patient collections.
 * 3. Create 8 sample donors and 6 sample patients.
 * 4. Write these same records to the /data/lifelink_db.xlsx file.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Point to .env in parent
const mongoose = require('mongoose');
const Donor = require('../models/Donor');
const Patient = require('../models/Patient');
const { connectDB } = require('../utils/db');
const { appendDonorToExcel, appendPatientToExcel } = require('../utils/excelHelper');
const fs = require('fs');
//const path = require('path');

// Clear existing Excel file before seeding
const dbPath = path.join(__dirname, '../data/lifelink_db.xlsx');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Cleared existing lifelink_db.xlsx');
}

const sampleDonors = [
  {
    name: 'Aarav Gupta',
    email: 'aarav.g@example.com',
    phone: '9876543210',
    bloodType: 'O+',
    location: { name: 'Koramangala, Bengaluru', type: 'Point', coordinates: [77.6245, 12.9352] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  {
    name: 'Siya Singh',
    email: 'siya.s@example.com',
    phone: '9876543211',
    bloodType: 'A+',
    location: { name: 'Juhu, Mumbai', type: 'Point', coordinates: [72.8295, 19.1076] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  {
    name: 'Rohan Mehra',
    email: 'rohan.m@example.com',
    phone: '9876543212',
    bloodType: 'B-',
    location: { name: 'Connaught Place, Delhi', type: 'Point', coordinates: [77.2167, 28.6330] },
    verified: false,
    otpVerified: false,
    availability: true,
  },
  {
    name: 'Isha Sharma',
    email: 'isha.s@example.com',
    phone: '9876543213',
    bloodType: 'AB+',
    location: { name: 'T. Nagar, Chennai', type: 'Point', coordinates: [80.2435, 13.0475] },
    verified: true,
    otpVerified: true,
    availability: false,
  },
  {
    name: 'Vikram Rao',
    email: 'vikram.r@example.com',
    phone: '9876543214',
    bloodType: 'O-',
    location: { name: 'Banjara Hills, Hyderabad', type: 'Point', coordinates: [78.4382, 17.4191] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  {
    name: 'Pooja Reddy',
    email: 'pooja.r@example.com',
    phone: '9876543215',
    bloodType: 'A+',
    location: { name: 'Salt Lake, Kolkata', type: 'Point', coordinates: [88.4068, 22.5852] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  {
    name: 'Arjun Desai',
    email: 'arjun.d@example.com',
    phone: '9876543216',
    bloodType: 'B+',
    location: { name: 'Manipal, Udupi', type: 'Point', coordinates: [74.7865, 13.3525] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  {
    name: 'Neha Patil',
    email: 'neha.p@example.com',
    phone: '9876543217',
    bloodType: 'A-',
    location: { name: 'Lalbagh, Mangalore', type: 'Point', coordinates: [74.8427, 12.8797] },
    verified: true,
    otpVerified: true,
    availability: true,
  },
  
];

const samplePatients = [
  {
    name: 'Anil Kumar',
    email: 'anil.k@example.com',
    phone: '9988776601',
    bloodType: 'O+',
    urgency: 'High',
    location: { name: 'MG Road, Bengaluru', type: 'Point', coordinates: [77.6072, 12.9745] },
  },
  {
    name: 'Sunita Nair',
    email: 'sunita.n@example.com',
    phone: '9988776602',
    bloodType: 'A+',
    urgency: 'Medium',
    location: { name: 'Andheri, Mumbai', type: 'Point', coordinates: [72.8697, 19.1197] },
  },
  {
    name: 'Raj Verma',
    email: 'raj.v@example.com',
    phone: '9988776603',
    bloodType: 'B-',
    urgency: 'High',
    location: { name: 'Hauz Khas, Delhi', type: 'Point', coordinates: [77.2057, 28.5501] },
  },
  {
    name: 'Meena Iyer',
    email: 'meena.i@example.com',
    phone: '9988776604',
    bloodType: 'AB+',
    urgency: 'Medium',
    location: { name: 'Adyar, Chennai', type: 'Point', coordinates: [80.2583, 13.0064] },
  },
  {
    name: 'David Williams',
    email: 'david.w@example.com',
    phone: '9988776605',
    bloodType: 'O-',
    urgency: 'High',
    location: { name: 'Gachibowli, Hyderabad', type: 'Point', coordinates: [78.3489, 17.4435] },
  },
  {
    name: 'Kavita Bose',
    email: 'kavita.b@example.com',
    phone: '9988776606',
    bloodType: 'A+',
    urgency: 'Low',
    location: { name: 'Park Street, Kolkata', type: 'Point', coordinates: [88.3510, 22.5532] },
  },
];



const seedDB = async () => {
  console.log('Connecting to DB...');
  await connectDB();

  try {
    console.log('Clearing old data...');
    await Donor.deleteMany({});
    await Patient.deleteMany({});

    console.log('Seeding Donors...');
    for (const donorData of sampleDonors) {
      const donor = new Donor(donorData);
      await donor.save();
      appendDonorToExcel(donor);
      console.log(`Seeded Donor: ${donor.name}`);
    }

    console.log('Seeding Patients...');
    for (const patientData of samplePatients) {
      const patient = new Patient(patientData);
      await patient.save();
      appendPatientToExcel(patient);
      console.log(`Seeded Patient: ${patient.name}`);
    }

    console.log('---------------------------');
    console.log('Database seeding complete!');
    console.log('MongoDB and lifelink_db.xlsx are now in sync.');
    console.log('---------------------------');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDB();