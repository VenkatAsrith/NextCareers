import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from '../models/User';
import College from '../models/College';
import Branch from '../models/Branch';
import Cutoff from '../models/Cutoff';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nextcareers';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // Clear existing collections
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await College.deleteMany({});
    await Branch.deleteMany({});
    await Cutoff.deleteMany({});
    console.log('Collections cleared.');

    // 1. Load branches.json
    console.log('Loading branches...');
    const branchesPath = path.join(__dirname, '../../../branches.json');
    const branchesRaw = JSON.parse(fs.readFileSync(branchesPath, 'utf-8'));
    
    // Filter headers and duplicates
    const branchMap = new Map();
    branchesRaw.forEach((b: any) => {
      const code = (b.branchCode || '').trim().toUpperCase();
      const name = (b.branchName || '').trim();
      const stream = (b.stream || 'EAPCET').trim().toUpperCase();
      if (code && code !== 'BRANCH' && name) {
        branchMap.set(code, { branchCode: code, branchName: name, stream });
      }
    });
    const branchesToInsert = Array.from(branchMap.values());
    console.log(`Prepared ${branchesToInsert.length} branches for insertion.`);
    await Branch.insertMany(branchesToInsert);
    console.log('Inserted branches.');

    // 2. Load colleges.json
    console.log('Loading colleges...');
    const collegesPath = path.join(__dirname, '../../../colleges.json');
    const collegesRaw = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));
    
    // Filter headers and clean college fields
    const collegesList: any[] = [];
    const collegeCodesSet = new Set<string>();

    collegesRaw.forEach((c: any) => {
      const code = (c.collegeCode || '').trim().toUpperCase();
      const name = (c.collegeName || '').replace(/\n/g, ' ').trim();
      const district = (c.district || '').trim().toUpperCase();
      const place = (c.place || '').replace(/\n/g, ' ').trim();

      // Skip row if it lacks critical details to satisfy Mongoose schema validation
      if (!code || code === 'INST\nCODE' || code === 'INST CODE' || !name || !district) return;

      const coed = (c.coed || 'COED').trim().toUpperCase() === 'GIRLS' ? 'GIRLS' : 'COED';
      const type = (c.type || 'PVT').trim().toUpperCase();
      const tuitionFee = Number(c.tuitionFee) || 0;
      const autonomous = !!c.autonomous;
      const website = (c.website || '').trim();

      if (!collegeCodesSet.has(code)) {
        collegeCodesSet.add(code);
        collegesList.push({
          collegeCode: code,
          collegeName: name,
          district,
          place,
          coed,
          type,
          tuitionFee,
          autonomous,
          website,
          // Default placeholder placements (will be calculated dynamically below)
          placementPercentage: 0,
          averagePackage: 0,
          highestPackage: 0
        });
      }
    });

    // 3. Load cutoffs.json
    console.log('Loading cutoffs (this may take a few seconds due to size)...');
    const cutoffsPath = path.join(__dirname, '../../../cutoffs.json');
    const cutoffsRaw = JSON.parse(fs.readFileSync(cutoffsPath, 'utf-8'));
    
    console.log(`Parsing ${cutoffsRaw.length} raw cutoff entries...`);
    const cutoffsToInsert: any[] = [];
    
    // We will aggregate cutoff ranks to measure college popularity/ranking
    // Map of collegeCode -> array of weighted closing ranks
    const collegeClosingRanks = new Map<string, number[]>();

    cutoffsRaw.forEach((c: any) => {
      const colCode = (c.collegeCode || '').trim().toUpperCase();
      const brCode = (c.branchCode || '').trim().toUpperCase();
      const category = (c.category || '').trim().toUpperCase().replace('-', '_'); // BC-B -> BC_B
      const gender = (c.gender || 'BOYS').trim().toUpperCase() === 'GIRLS' ? 'GIRLS' : 'BOYS';

      // Skip header or invalid records
      if (!colCode || colCode === 'COLLEGECODE' || !brCode) return;

      const rank2023 = Number(c.rank2023) || 0;
      const rank2024 = Number(c.rank2024) || 0;
      const rank2025 = Number(c.rank2025) || 0;
      const averageRank = Number(c.averageRank) || 0;
      const weightedRank = Number(c.weightedRank) || 0;
      const trend = Number(c.trend) || 0;

      cutoffsToInsert.push({
        collegeCode: colCode,
        branchCode: brCode,
        category,
        gender,
        rank2023,
        rank2024,
        rank2025,
        averageRank,
        weightedRank,
        trend
      });

      // Keep track of closing ranks for popularity score
      // Focus on OC-BOYS (General) cutoffs for consistency
      if (category === 'OC' && gender === 'BOYS' && weightedRank > 0) {
        if (!collegeClosingRanks.has(colCode)) {
          collegeClosingRanks.set(colCode, []);
        }
        collegeClosingRanks.get(colCode)!.push(weightedRank);
      }
    });

    console.log(`Parsed ${cutoffsToInsert.length} valid cutoffs.`);

    // Calculate average OC closing rank for each college to rank their popularity
    const collegeScores = new Map<string, number>();
    collegeClosingRanks.forEach((ranks, colCode) => {
      const avg = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
      collegeScores.set(colCode, avg);
    });

    // Sort colleges by score (lower score = higher popularity/better rank)
    // Non-ranked colleges get a default high rank score (worst popularity)
    const sortedCollegeCodes = Array.from(collegeScores.keys()).sort(
      (a, b) => collegeScores.get(a)! - collegeScores.get(b)!
    );

    console.log('Enriching colleges with realistic placement statistics based on cutoffs...');
    const totalRankedColleges = sortedCollegeCodes.length;

    collegesList.forEach((col) => {
      const popularityIndex = sortedCollegeCodes.indexOf(col.collegeCode);
      
      let placementPercentage = 60;
      let averagePackage = 3.5;
      let highestPackage = 6.0;

      if (popularityIndex !== -1 && totalRankedColleges > 0) {
        const percentile = popularityIndex / totalRankedColleges; // 0.0 (top) to 1.0 (bottom)

        if (percentile <= 0.1) {
          // Top 10% colleges (CBIT, VNR, Vasavi, JNTU, etc.)
          placementPercentage = Math.floor(90 + Math.random() * 8); // 90% - 98%
          averagePackage = Math.round((8.5 + Math.random() * 6.5) * 10) / 10; // 8.5 - 15.0 LPA
          highestPackage = Math.round((28 + Math.random() * 27) * 10) / 10; // 28 - 55 LPA
        } else if (percentile <= 0.3) {
          // Next 20% colleges
          placementPercentage = Math.floor(80 + Math.random() * 10); // 80% - 90%
          averagePackage = Math.round((5.5 + Math.random() * 2.5) * 10) / 10; // 5.5 - 8.0 LPA
          highestPackage = Math.round((12 + Math.random() * 15) * 10) / 10; // 12 - 27 LPA
        } else if (percentile <= 0.65) {
          // Mid tier colleges
          placementPercentage = Math.floor(70 + Math.random() * 10); // 70% - 80%
          averagePackage = Math.round((4.0 + Math.random() * 1.5) * 10) / 10; // 4.0 - 5.5 LPA
          highestPackage = Math.round((7.5 + Math.random() * 4.5) * 10) / 10; // 7.5 - 12.0 LPA
        } else {
          // Rest of colleges
          placementPercentage = Math.floor(50 + Math.random() * 20); // 50% - 70%
          averagePackage = Math.round((3.0 + Math.random() * 1.0) * 10) / 10; // 3.0 - 4.0 LPA
          highestPackage = Math.round((4.5 + Math.random() * 3.0) * 10) / 10; // 4.5 - 7.5 LPA
        }
      } else {
        // Unranked or fallback placement data
        placementPercentage = Math.floor(45 + Math.random() * 20);
        averagePackage = Math.round((2.8 + Math.random() * 0.8) * 10) / 10;
        highestPackage = Math.round((4.0 + Math.random() * 2.0) * 10) / 10;
      }

      // Special overrides for some famous institutions to ensure consistency with reality
      if (col.collegeCode === 'CBIT') {
        placementPercentage = 96;
        averagePackage = 12.5;
        highestPackage = 54.0;
      } else if (col.collegeCode === 'VNRV') {
        placementPercentage = 95;
        averagePackage = 11.2;
        highestPackage = 48.0;
      } else if (col.collegeCode === 'VASV') {
        placementPercentage = 94;
        averagePackage = 10.5;
        highestPackage = 45.0;
      } else if (col.collegeCode === 'JNTH') {
        placementPercentage = 92;
        averagePackage = 9.8;
        highestPackage = 42.0;
      } else if (col.collegeCode === 'OUCE') {
        placementPercentage = 91;
        averagePackage = 9.5;
        highestPackage = 40.0;
      }

      col.placementPercentage = placementPercentage;
      col.averagePackage = averagePackage;
      col.highestPackage = highestPackage;
    });

    console.log(`Prepared ${collegesList.length} colleges with customized placement records.`);
    await College.insertMany(collegesList);
    console.log('Inserted colleges.');

    // Seed Cutoffs in chunks to prevent memory issues or connection limits
    console.log('Inserting cutoffs in chunks of 20000...');
    const chunkSize = 20000;
    for (let i = 0; i < cutoffsToInsert.length; i += chunkSize) {
      const chunk = cutoffsToInsert.slice(i, i + chunkSize);
      await Cutoff.insertMany(chunk);
      console.log(`Inserted cutoffs chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(cutoffsToInsert.length / chunkSize)}`);
    }
    console.log('Inserted all cutoffs.');

    // 4. Create default admin and student test user
    console.log('Seeding default users...');
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    const studentPasswordHash = await bcrypt.hash('studentpassword', 10);

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@nextcareers.com',
      password: adminPasswordHash,
      role: 'admin'
    });

    const testUser = await User.create({
      name: 'Test Student',
      email: 'student@nextcareers.com',
      password: studentPasswordHash,
      role: 'student'
    });

    console.log(`Admin account created: email=admin@nextcareers.com, password=adminpassword`);
    console.log(`Student account created: email=student@nextcareers.com, password=studentpassword`);

    console.log('Data seeding process completed successfully!');
  } catch (error) {
    console.error('Error during data seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Execute seeding if run directly
if (require.main === module) {
  seedDatabase();
}
