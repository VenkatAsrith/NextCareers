import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Student from '../models/Student';
import Cutoff from '../models/Cutoff';
import College from '../models/College';
import Branch from '../models/Branch';

// Helper to extract numbers from text
const extractRank = (text: string): number | null => {
  // Check for patterns like "42k" or "42.5k"
  const kPattern = /(\d+(?:\.\d+)?)\s*k\b/i;
  const matchK = text.match(kPattern);
  if (matchK) {
    return Math.round(parseFloat(matchK[1]) * 1000);
  }

  // Check for normal numbers between 100 and 999999
  const numPattern = /\b(\d{3,6})\b/;
  const matchNum = text.match(numPattern);
  if (matchNum) {
    return parseInt(matchNum[1], 10);
  }

  return null;
};

// POST /chat
export const handleChatQuery = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const text = message.toUpperCase();

    // 1. Fetch user profile for default rank, category, gender if not specified in text
    let userRank = extractRank(text);
    let userCategory = 'OC';
    let userGender: 'BOYS' | 'GIRLS' = 'BOYS';

    const student = await Student.findOne({ userId });
    if (student) {
      if (!userRank) userRank = student.rank;
      userCategory = student.category;
      userGender = student.gender;
    }

    // 2. Identify College Code
    // Fetch all colleges to scan their codes/names in the text
    const colleges = await College.find({}).select('collegeCode collegeName');
    let matchedCollegeCode = '';
    let matchedCollegeName = '';

    for (const col of colleges) {
      // Check code match (e.g. MREC, CBIT)
      const codeRegex = new RegExp(`\\b${col.collegeCode}\\b`, 'i');
      if (codeRegex.test(text)) {
        matchedCollegeCode = col.collegeCode;
        matchedCollegeName = col.collegeName;
        break;
      }
    }

    // If code not matched, scan for part of the name
    if (!matchedCollegeCode) {
      for (const col of colleges) {
        const cleanedName = col.collegeName.replace('ENGINEERING COLLEGE', '').replace('INSTITUTE OF TECHNOLOGY', '').trim();
        if (cleanedName.length > 5 && text.includes(cleanedName.toUpperCase())) {
          matchedCollegeCode = col.collegeCode;
          matchedCollegeName = col.collegeName;
          break;
        }
      }
    }

    // 3. Identify Branch Code
    const branches = await Branch.find({}).select('branchCode branchName');
    let matchedBranchCode = '';
    let matchedBranchName = '';

    for (const br of branches) {
      const codeRegex = new RegExp(`\\b${br.branchCode}\\b`, 'i');
      if (codeRegex.test(text)) {
        matchedBranchCode = br.branchCode;
        matchedBranchName = br.branchName;
        break;
      }
    }

    // Check mapping variations (e.g., "AI&ML" or "CS-ML" -> CSM)
    if (!matchedBranchCode) {
      if (text.includes('CSE') || text.includes('COMPUTER SCIENCE')) {
        matchedBranchCode = 'CSE';
        matchedBranchName = 'COMPUTER SCIENCE AND ENGINEERING';
      } else if (text.includes('ECE') || text.includes('ELECTRONICS')) {
        matchedBranchCode = 'ECE';
        matchedBranchName = 'ELECTRONICS AND COMMUNICATION ENGINEERING';
      } else if (text.includes('CSM') || text.includes('ARTIFICIAL INTELLIGENCE') || text.includes('AI') || text.includes('AIML')) {
        matchedBranchCode = 'CSM';
        matchedBranchName = 'COMPUTER SCIENCE & ENGG (AI & ML)';
      } else if (text.includes('EEE') || text.includes('ELECTRICAL')) {
        matchedBranchCode = 'EEE';
        matchedBranchName = 'ELECTRICAL AND ELECTRONICS ENGINEERING';
      } else if (text.includes('INF') || text.includes('INFORMATION TECHNOLOGY') || text.includes(' IT ')) {
        matchedBranchCode = 'INF';
        matchedBranchName = 'INFORMATION TECHNOLOGY';
      }
    }

    // 4. Formulate Response
    if (matchedCollegeCode && matchedBranchCode) {
      const targetRank = userRank || 50000; // fallback if no rank is found anywhere

      // Query cutoffs
      const categories = userCategory === 'SC' ? ['SC_I', 'SC_II', 'SC_III'] : [userCategory.replace('-', '_')];
      const genders = userGender === 'GIRLS' ? ['BOYS', 'GIRLS'] : ['BOYS'];

      const cutoffs = await Cutoff.find({
        collegeCode: matchedCollegeCode,
        branchCode: matchedBranchCode,
        category: { $in: categories },
        gender: { $in: genders }
      });

      if (cutoffs.length === 0) {
        return res.json({
          reply: `I found ${matchedCollegeName} (${matchedCollegeCode}) and the branch ${matchedBranchCode}, but there are no historical cutoff records for Category ${userCategory} (${userGender}). Let me know if you would like me to check a different category.`
        });
      }

      // Find the maximum cutoff rank (easiest entry)
      let bestCutoff = cutoffs[0];
      let maxRank = 0;
      cutoffs.forEach(c => {
        const r = c.rank2025 > 0 ? c.rank2025 : c.weightedRank;
        if (r > maxRank) {
          maxRank = r;
          bestCutoff = c;
        }
      });

      const cutoffRank = maxRank;
      const ratio = cutoffRank / targetRank;
      let probability = 0;
      let verbiage = '';

      if (ratio >= 1.25) {
        probability = Math.min(99, Math.round(85 + (ratio - 1.25) * 15));
        verbiage = 'Yes, you have an excellent chance!';
      } else if (ratio >= 1.0) {
        probability = Math.round(50 + ((ratio - 1.0) / 0.25) * 34);
        verbiage = 'Yes, you have a solid target chance.';
      } else if (ratio >= 0.7) {
        probability = Math.round(10 + ((ratio - 0.7) / 0.3) * 39);
        verbiage = 'It is possible, but it will be a Dream/Stretch option.';
      } else {
        probability = Math.max(1, Math.round((ratio / 0.7) * 9));
        verbiage = 'No, it is highly unlikely based on previous cutoffs.';
      }

      const reply = `${verbiage}\n\nCollege: **${matchedCollegeName} (${matchedCollegeCode})**\nBranch: **${matchedBranchName} (${matchedBranchCode})**\nYour Rank: **${targetRank.toLocaleString()}** (Category: ${userCategory}, Gender: ${userGender === 'BOYS' ? 'Male' : 'Female'})\n\n**Historical Cutoffs (Closing Rank):**\n- 2025 Cutoff: **${bestCutoff.rank2025 > 0 ? bestCutoff.rank2025.toLocaleString() : 'N/A'}**\n- 2024 Cutoff: **${bestCutoff.rank2024 > 0 ? bestCutoff.rank2024.toLocaleString() : 'N/A'}**\n- 2023 Cutoff: **${bestCutoff.rank2023 > 0 ? bestCutoff.rank2023.toLocaleString() : 'N/A'}**\n\n**Admission Probability:** **${probability}%**`;

      return res.json({ reply });
    }

    // Fallback: If could not match college or branch
    let missingInfo = [];
    if (!matchedCollegeCode) missingInfo.push('college name/code (e.g. CBIT, MREC)');
    if (!matchedBranchCode) missingInfo.push('branch code (e.g. CSE, ECE)');

    res.json({
      reply: `I'd love to help you predict your admission chances! However, I couldn't identify the ${missingInfo.join(' or ')} in your message. 

Could you please ask in this format: *"Can I get CSE at CBIT with a 15k rank?"*`
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
