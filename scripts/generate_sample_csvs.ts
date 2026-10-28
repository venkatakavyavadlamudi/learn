/**
 * Generates sample CSV files with exact column names (e.g. Student_ID, Course_ID)
 * for testing the 15-dataset import pipeline.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');

const SAMPLES: Record<string, string> = {
  'app_users.csv': `User_ID,Email,Full_Name,Role,Status,Phone,Avatar_URL,Created_At
USR001,superadmin@learnai.com,System Administrator,admin,active,+1-555-0100,,2026-08-01T00:00:00Z
USR002,marcus.chen@learnai.com,Prof. Marcus Chen,mentor,active,+1-555-0101,,2026-08-01T00:00:00Z
USR003,sarah.jenkins@learnai.com,Dr. Sarah Jenkins,trainer,active,+1-555-0102,,2026-08-01T00:00:00Z
USR004,alex.morgan@learnai.com,Alex Morgan,student,active,+1-555-0103,,2026-08-01T00:00:00Z
USR005,priya.sharma@learnai.com,Priya Sharma,student,active,+1-555-0104,,2026-08-01T00:00:00Z`,

  'mentors.csv': `Mentor_ID,User_ID,Full_Name,Email,Phone,Qualification,Specialization,Years_Of_Experience,Skills,Availability,Max_Mentees,Status
MEN001,USR002,Prof. Marcus Chen,marcus.chen@learnai.com,+1-555-0101,Ph.D. in Computer Science,AI & Machine Learning,8,Machine Learning;Python;System Design,Available,15,active`,

  'trainers.csv': `Trainer_ID,User_ID,Full_Name,Email,Phone,Qualification,Specialization,Experience_Years,Skills,Courses_Can_Teach,Status
TRN001,USR003,Dr. Sarah Jenkins,sarah.jenkins@learnai.com,+1-555-0102,Ph.D. Software Engineering,Full-Stack & Cloud,10,Python;Cloud Architecture;FastAPI,Modern Python for AI;Enterprise SQL,active`,

  'courses.csv': `Course_ID,Title,Description,Category,Duration,Difficulty,Skills_Covered,Learning_Level,Trainer_ID,Enrolled_Count,Rating,Total_Lessons,Is_Published
CRS001,Modern Python for AI,Master core Python syntax and OOP for machine learning systems,Computer Science,8 Weeks,Beginner,Python;OOP;Data Structures,Undergraduate,TRN001,120,4.90,24,TRUE
CRS002,Machine Learning Foundations,Statistical learning and neural networks,Artificial Intelligence,10 Weeks,Intermediate,Linear Regression;Scikit-Learn;Math,Undergraduate,TRN001,95,4.85,25,TRUE
CRS003,Generative AI & LLMs,Production RAG and prompt engineering,Artificial Intelligence,10 Weeks,Intermediate,LangChain;FastAPI;Vector DBs,Undergraduate,TRN001,110,4.95,20,TRUE`,

  'content_chunks.csv': `Chunk_ID,Course_ID,Module_ID,Module_Title,Chunk_Order,Title,Duration,Content_Summary,Content_Body,Resource_URL,Is_Published
CHK001,CRS001,MOD001,Python Syntax & OOP,1,Variables & Memory Management,25 min,Mutable vs immutable types and references,,https://resources.learnai.com/py1.pdf,TRUE
CHK002,CRS001,MOD001,Python Syntax & OOP,2,Functions and Decorators,35 min,First class functions and closures,,https://resources.learnai.com/py2.pdf,TRUE`,

  'students.csv': `Student_ID,User_ID,Full_Name,Email,Phone,College_Name,Degree,Branch,Graduation_Year,Learning_Level,Skills,Career_Goal,Current_Course_ID,Mentor_ID,Status
STU001,USR004,Alex Morgan,alex.morgan@learnai.com,+1-555-0103,State University,Bachelor of Technology,Computer Science,2026,Undergraduate,Python;SQL;Git,Software Engineer,CRS001,MEN001,active
STU002,USR005,Priya Sharma,priya.sharma@learnai.com,+1-555-0104,National Institute,Bachelor of Technology,Data Science,2026,Undergraduate,Python;Scikit-Learn;Math,AI Engineer,CRS002,MEN001,active`,

  'student_features.csv': `Student_ID,Readiness_Score,Job_Ready_Target,Overall_Progress,Streak_Days,Weekly_Study_Hours,Target_Study_Hours,Avg_Assessment_Score,Assignments_Completed,Total_Assignments,Attendance_Rate,Risk_Status,Last_Active_At
STU001,74.5,75.0,68.0,7,14.5,15.0,82.0,12,15,92.0,Good,2026-10-25T10:00:00Z
STU002,54.0,75.0,42.0,2,8.0,15.0,62.0,6,15,74.0,Needs Attention,2026-10-24T15:00:00Z`,

  'skill_assessments.csv': `Assessment_ID,Student_ID,Course_ID,Skill_Name,Category,Score,Benchmark_Score,Target_Score,Percentile,Assessment_Date,Status
ASM001,STU001,CRS001,Python Programming,Technical Core,88.0,75.0,85.0,Top 15%,2026-10-20T12:00:00Z,passed
ASM002,STU001,CRS001,SQL Querying,Technical Core,82.0,75.0,85.0,Top 25%,2026-10-15T12:00:00Z,passed
ASM003,STU002,CRS002,Linear Regression,Machine Learning,64.0,75.0,85.0,Top 55%,2026-10-18T12:00:00Z,needs_improvement`,

  'assignments.csv': `Assignment_ID,Course_ID,Trainer_ID,Title,Description,Due_Date,Total_Points,Passing_Score,Batch_Name
ASN001,CRS001,TRN001,Binary Search Tree Implementation,Build an unbalanced binary search tree with traversal,2026-11-05T23:59:00Z,100,60,Batch 2026-A
ASN002,CRS002,TRN001,Gradient Descent from Scratch,Implement linear regression batch gradient descent,2026-11-10T23:59:00Z,100,60,Batch 2026-B`,

  'submissions.csv': `Submission_ID,Assignment_ID,Student_ID,Evaluator_ID,Submission_URL,Score,Status,Feedback,Submitted_At,Graded_At
SUB001,ASN001,STU001,TRN001,https://github.com/alex/bst,92.0,evaluated,Clean OOP implementation with unit tests,2026-10-22T14:30:00Z,2026-10-23T09:00:00Z
SUB002,ASN002,STU002,TRN001,https://github.com/priya/grad,null,submitted,,2026-10-24T18:00:00Z,null`,

  'weekly_engagement.csv': `Engagement_ID,Student_ID,Week_Label,Day_Name,Study_Hours,Target_Hours,Active_Logins,Lessons_Completed,Recorded_Date
ENG001,STU001,Wk 1,Mon,2.5,2.5,2,1,2026-10-20
ENG002,STU001,Wk 1,Tue,3.0,2.5,3,2,2026-10-21
ENG003,STU001,Wk 1,Wed,2.0,2.5,1,1,2026-10-22
ENG004,STU001,Wk 1,Thu,3.5,2.5,2,2,2026-10-23
ENG005,STU001,Wk 1,Fri,3.5,2.5,2,2,2026-10-24`,

  'doubts.csv': `Doubt_ID,Student_ID,Course_ID,Mentor_ID,Topic,Question,Priority,Resolution_Status,Solution,Asked_At,Resolved_At
DBT001,STU001,CRS001,MEN001,Dynamic Programming Tabulation,Cannot formulate state transitions for 0/1 Knapsack,urgent,resolved,Remember that dp[i][w] depends on dp[i-1][w] and dp[i-1][w-wt[i]],2026-10-22T08:00:00Z,2026-10-22T11:00:00Z
DBT002,STU002,CRS002,MEN001,Gradient Vanishing in Deep Nets,Why does ReLU avoid vanishing gradients?,normal,pending,,2026-10-24T14:00:00Z,null`,

  'practice_sessions.csv': `Practice_ID,Student_ID,Course_ID,Topic,Difficulty,Questions_Answered,Correct_Count,Accuracy,Is_Weak,Recommendation,Practiced_At
PRC001,STU001,CRS001,Python Generators,Medium,20,18,90.0,FALSE,,2026-10-22T16:00:00Z
PRC002,STU001,CRS001,Recursion Trees,Hard,15,8,53.3,TRUE,Practice tree traversal problems with base cases,2026-10-23T17:00:00Z
PRC003,STU002,CRS002,Matrix Vector Multiplications,Easy,25,24,96.0,FALSE,,2026-10-24T11:00:00Z`,

  'mock_interviews.csv': `Interview_ID,Student_ID,Mentor_ID,Attempt_Label,Role_Title,Technical_Score,Behavioral_Score,Overall_Score,Cohort_Avg_Score,Feedback,Scheduled_At,Completed_At
INT001,STU001,MEN001,Attempt 1,Software Engineer,68.0,72.0,70.0,65.0,Good problem decomposition; clarify time complexity earlier,2026-10-10T10:00:00Z,2026-10-10T11:00:00Z
INT002,STU001,MEN001,Attempt 2,Software Engineer,82.0,80.0,81.0,73.0,Much better handling of edge cases in binary tree traversals,2026-10-20T10:00:00Z,2026-10-20T11:00:00Z`,

  'mentor_escalations.csv': `Escalation_ID,Mentor_ID,Student_ID,Reason,Severity,Description,Action_Taken,Status,Created_At,Resolved_At
ESC001,MEN001,STU002,Low Attendance / Inactive,High,Student missed 2 consecutive live lab sessions and lagging on assignment 2,Scheduled 1-on-1 check-in call with student,in_progress,2026-10-24T09:00:00Z,null`,
};

export function generateAllSamples() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const [filename, content] of Object.entries(SAMPLES)) {
    const target = path.join(DATA_DIR, filename);
    fs.writeFileSync(target, content.trim() + '\n', 'utf8');
    console.log(`Generated sample dataset: data/${filename}`);
  }
}

if (process.argv[1]?.endsWith('generate_sample_csvs.ts')) {
  generateAllSamples();
}
