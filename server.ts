import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { backendDb, hashString } from './server/database.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client for backend persistence & role synchronization
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let serverSupabase: any = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id') && !supabaseKey.includes('your-anon-public-key')) {
  try {
    serverSupabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('[LearnAI Server] Could not initialize Supabase client:', err);
  }
}

async function syncRoleToSupabase(userId: string, newRole: string, email?: string) {
  if (!serverSupabase) return;
  try {
    const now = new Date().toISOString();
    const cleanRole = String(newRole).toLowerCase().trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (cleanEmail) {
      await serverSupabase
        .from('app_users')
        .update({ role: cleanRole, updated_at: now })
        .eq('email', cleanEmail);

      await serverSupabase.from('learnai_users').upsert(
        {
          user_id: userId || null,
          email: cleanEmail,
          role: cleanRole,
          updated_at: now,
        },
        { onConflict: 'email' }
      );
    } else if (userId) {
      await serverSupabase
        .from('learnai_users')
        .update({ role: cleanRole, updated_at: now })
        .eq('user_id', userId);
    }
  } catch (sbErr) {
    console.warn('[LearnAI Server] Supabase role sync notice:', sbErr);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LearnAI API with Role Verification & Security Gatekeeper',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // ========================================================
  // AUTHENTICATION & ROLE VERIFICATION ENDPOINTS
  // ========================================================

  // 0. First Admin Status & Bootstrap Check (Requirements 1, 3)
  app.get('/api/auth/admin-status', (_req, res) => {
    const adminCount = backendDb.getAdminCount();
    return res.json({
      hasAdmin: adminCount > 0,
      adminCount,
    });
  });

  // 0b. First Admin One-Time Setup (Requirements 1, 2, 3, 19)
  // Check the database: Does an Admin account already exist?
  // If adminCount == 0, allow the FIRST account to be created as Admin.
  // After the first Admin is created: adminCount > 0, lock setup!
  app.post('/api/auth/setup-first-admin', (req, res) => {
    // ATOMIC SECURITY CHECK: If an Admin already exists, reject immediately
    if (backendDb.hasAdmin()) {
      return res.status(403).json({
        success: false,
        error: 'Administrator setup has already been completed.',
      });
    }

    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Email, Password, and Confirm Password are all required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match. Please re-enter your password.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    const result = backendDb.setupFirstAdmin({
      fullName,
      email,
      password,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      user: {
        userId: result.user!.userId,
        email: result.user!.email,
        name: result.admin!.fullName,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: result.admin!.createdAt,
        profile: result.admin,
      },
    });
  });

  // 1. Backend Verification Code Pre-check (prevents client-side spoofing)
  app.post('/api/verification-codes/validate', (req, res) => {
    const { code, requestedRole } = req.body;
    if (!code || !requestedRole) {
      return res.status(400).json({ valid: false, error: 'Code and requested role are required.' });
    }

    if (requestedRole !== 'mentor' && requestedRole !== 'trainer') {
      return res.status(400).json({ valid: false, error: 'Verification codes are only applicable for Mentor or Trainer roles.' });
    }

    const check = backendDb.validateCode(code, requestedRole);
    if (!check.valid) {
      return res.status(400).json({ valid: false, error: check.error });
    }

    return res.json({
      valid: true,
      role: requestedRole,
      message: `Authorized ${requestedRole} verification code accepted.`,
    });
  });

  // Organization lookup for signup and admin management
  app.get('/api/organizations', (_req, res) => {
    const orgs = backendDb.getAllOrganizations();
    res.json({ organizations: orgs });
  });

  // 2. Normal Student Registration Endpoint (Section 1, 2, 3, 4)
  // RULE: Every normal person who registers ALWAYS becomes a STUDENT.
  // Mentor, Trainer, Admin, Super Admin CANNOT be created through public signup.
  app.post('/api/auth/register', (req, res) => {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      Organization_ID,
      organization,
      college,
      role,
    } = req.body;

    // Strict barrier: reject any attempt to register mentor, trainer, admin, super_admin publicly
    if (role && role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Normal registration is strictly for Students. Mentors, Trainers, and Administrators cannot be selected during normal signup.',
      });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Email address, and Password are required.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match. Please verify your password confirmation.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
    }

    const result = backendDb.registerStudent({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      password,
      Organization_ID,
      organization,
      college,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(201).json({
      success: true,
      user: {
        userId: result.user!.userId,
        email: result.user!.email,
        name: result.student!.fullName,
        role: 'student',
        status: result.user!.status,
        Organization_ID: result.user!.Organization_ID,
        organizationName: result.student!.collegeName,
        emailVerified: result.user!.emailVerified,
        profile: result.student,
      },
      message: 'Student account created successfully. Welcome to LearnAI!',
    });
  });

  // 3. Authoritative Login (Only Email & Password)
  // Do NOT trust the role selected on the Login page.
  // The DATABASE ROLE must always be authoritative.
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = backendDb.getUserByEmail(cleanEmail);

    if (user) {
      const enteredHash = hashString(password);
      if (user.passwordHash !== enteredHash) {
        return res.status(401).json({ success: false, error: 'Invalid password credentials.' });
      }

      // Check account suspension
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Your account has been suspended by an administrator. Please contact support.',
        });
      }

      // Fetch profile details according to authoritative role
      let profile: any = null;
      if (user.role === 'student') profile = backendDb.getStudentByUserId(user.userId);
      else if (user.role === 'mentor') profile = backendDb.getMentorByUserId(user.userId);
      else if (user.role === 'trainer') profile = backendDb.getTrainerByUserId(user.userId);
      else if (user.role === 'public_user') profile = backendDb.getPublicUserByUserId(user.userId);
      else if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'institution_admin') {
        profile = backendDb.getAdminByUserId(user.userId);
      }

      return res.json({
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: profile?.fullName || user.email.split('@')[0],
          role: user.role,
          status: user.status,
          Organization_ID: user.Organization_ID,
          organizationName: profile?.collegeName || profile?.organizationName,
          emailVerified: user.emailVerified,
          profile,
        },
      });
    }

    // If not found in backendDb, check Supabase Auth if configured
    if (serverSupabase) {
      try {
        const { data, error } = await serverSupabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (data?.user) {
          const { data: appUser } = await serverSupabase
            .from('app_users')
            .select('*')
            .eq('email', cleanEmail)
            .limit(1);

          const { data: lu } = await serverSupabase
            .from('learnai_users')
            .select('*')
            .or(`email.eq.${cleanEmail},user_id.eq.${data.user.id}`)
            .limit(1);

          const role = appUser?.[0]?.role || lu?.[0]?.role || data.user.user_metadata?.role || 'student';
          return res.json({
            success: true,
            user: {
              userId: data.user.id,
              email: data.user.email || cleanEmail,
              name: appUser?.[0]?.full_name || lu?.[0]?.full_name || data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              role,
              status: appUser?.[0]?.status || lu?.[0]?.status || 'active',
              emailVerified: Boolean(data.user.email_confirmed_at),
              profile: {
                fullName: appUser?.[0]?.full_name || lu?.[0]?.full_name || cleanEmail.split('@')[0],
                email: cleanEmail,
              },
            },
          });
        }

        if (error) {
          if (error.code === 'email_not_confirmed') {
            return res.status(401).json({
              success: false,
              error: 'Email address has not been confirmed yet. Please check your inbox.',
            });
          }
          return res.status(401).json({
            success: false,
            error: error.message || 'Invalid email or password.',
          });
        }
      } catch (sbErr: any) {
        console.warn('[LearnAI Server] Supabase auth attempt notice:', sbErr?.message);
      }
    }

    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  });

  // 4. Email Verification Endpoint
  app.post('/api/auth/verify-email', (req, res) => {
    const { email, token } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required for verification.' });
    }

    const result = backendDb.verifyEmail(email, token);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const user = backendDb.getUserByEmail(email);
    return res.json({
      success: true,
      message: 'Email address verified successfully.',
      user: {
        emailVerified: true,
        status: user?.status,
        role: user?.role,
      },
    });
  });

  // ========================================================
  // ADMIN-ONLY REGISTRATION REVIEW & VERIFICATION CODES
  // ========================================================

  // Middleware: verify admin role header and database permissions
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminEmail = (req.headers['x-admin-email'] as string)?.trim().toLowerCase();
    if (!adminEmail) {
      return res.status(401).json({ success: false, error: 'Authentication required: Missing administrator email header.' });
    }

    // 1. Check local backend database
    const localUser = backendDb.getUserByEmail(adminEmail);
    if (localUser && (localUser.role === 'admin' || localUser.role === 'super_admin' || localUser.role === 'institution_admin')) {
      return next();
    }

    // 2. Check Supabase database if configured
    if (serverSupabase) {
      try {
        const { data: lu } = await serverSupabase
          .from('learnai_users')
          .select('role')
          .ilike('email', adminEmail)
          .limit(1);

        const luRole = lu?.[0]?.role ? String(lu[0].role).toLowerCase().trim() : null;
        if (luRole === 'admin' || luRole === 'super_admin' || luRole === 'institution_admin' || luRole === 'super admin') {
          return next();
        }

        const { data: appU } = await serverSupabase
          .from('app_users')
          .select('role')
          .ilike('email', adminEmail)
          .limit(1);

        const appRole = appU?.[0]?.role ? String(appU[0].role).toLowerCase().trim() : null;
        if (appRole === 'admin' || appRole === 'super_admin' || appRole === 'institution_admin' || appRole === 'super admin') {
          return next();
        }
      } catch (err: any) {
        console.warn('[LearnAI Security] Server verifyAdmin database check warning:', err?.message);
      }
    }

    return res.status(403).json({ success: false, error: 'Access forbidden: Account does not have administrator privileges.' });
  };

  // Get pending registrations
  app.get('/api/admin/pending-registrations', verifyAdmin, (_req, res) => {
    const pending = backendDb.getPendingRegistrations();
    res.json({ pending });
  });

  // Approve a pending registration
  app.post('/api/admin/approve-registration', verifyAdmin, (req, res) => {
    const { userId, approvedBy } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const result = backendDb.approveRegistration(userId, approvedBy);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json({ success: true, message: 'User registration approved successfully.' });
  });

  // Reject a registration
  app.post('/api/admin/reject-registration', verifyAdmin, (req, res) => {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const result = backendDb.rejectRegistration(userId, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json({ success: true, message: 'Registration rejected.' });
  });

  // Get all verification codes
  app.get('/api/admin/verification-codes', verifyAdmin, (_req, res) => {
    const codes = backendDb.getAllVerificationCodes();
    res.json({ codes });
  });

  // Create new verification code
  app.post('/api/admin/verification-codes', verifyAdmin, (req, res) => {
    const { role, customCode, expiresInDays, usageLimit, note, createdBy } = req.body;
    if (!role || (role !== 'mentor' && role !== 'trainer')) {
      return res.status(400).json({ error: 'Role must be mentor or trainer.' });
    }

    const created = backendDb.createVerificationCode(
      role,
      customCode,
      Number(expiresInDays) || 30,
      Number(usageLimit) || 5,
      note,
      createdBy || 'admin@learnai.com'
    );

    return res.json({
      success: true,
      codeId: created.codeId,
      plainCode: created.plainCode,
      entity: created.entity,
      message: `New ${role.toUpperCase()} verification code generated successfully.`,
    });
  });

  // Revoke code
  app.delete('/api/admin/verification-codes/:id', verifyAdmin, (req, res) => {
    const success = backendDb.revokeVerificationCode(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Verification code not found.' });
    }
    res.json({ success: true, message: 'Verification code revoked.' });
  });

  // Regenerate code
  app.post('/api/admin/verification-codes/:id/regenerate', verifyAdmin, (req, res) => {
    const regenerated = backendDb.regenerateVerificationCode(req.params.id);
    if (!regenerated) {
      return res.status(404).json({ error: 'Verification code not found.' });
    }
    res.json({
      success: true,
      plainCode: regenerated.plainCode,
      entity: regenerated.entity,
      message: 'Code regenerated with a fresh key and reset usage count.',
    });
  });

  // Get all user dossiers (filtered by admin organization for institution admins)
  app.get('/api/admin/users', verifyAdmin, (req, res) => {
    const adminEmail = (req.headers['x-admin-email'] as string) || '';
    const adminUser = adminEmail ? backendDb.getUserByEmail(adminEmail) : null;

    let orgFilter: string | null = null;
    if (adminUser && adminUser.role === 'institution_admin' && adminUser.Organization_ID) {
      orgFilter = adminUser.Organization_ID;
    } else if (req.query.organizationId && typeof req.query.organizationId === 'string' && req.query.organizationId !== 'all') {
      orgFilter = req.query.organizationId;
    }

    const users = backendDb.getAllUserDossiers(orgFilter);
    res.json({ users });
  });

  // Get role change history audit records (Section 9)
  app.get('/api/admin/role-history', verifyAdmin, (req, res) => {
    const adminEmail = (req.headers['x-admin-email'] as string) || '';
    const adminUser = adminEmail ? backendDb.getUserByEmail(adminEmail) : null;

    let orgFilter: string | null = null;
    if (adminUser && adminUser.role === 'institution_admin' && adminUser.Organization_ID) {
      orgFilter = adminUser.Organization_ID;
    } else if (req.query.organizationId && typeof req.query.organizationId === 'string' && req.query.organizationId !== 'all') {
      orgFilter = req.query.organizationId;
    }

    const history = backendDb.getAllRoleChangeHistory(orgFilter);
    res.json({ history });
  });

  // Promote / Change User Role (Sections 5, 6, 7, 8, 9)
  app.post('/api/admin/promote-user', verifyAdmin, async (req, res) => {
    const adminEmail = (req.headers['x-admin-email'] as string) || 'admin@learnai.com';
    const adminUser = backendDb.getUserByEmail(adminEmail);

    const {
      userId,
      newRole,
      email,
      reason,
      qualification,
      specialization,
      yearsOfExperience,
      expertise,
      skills,
      availability,
      coursesCanTeach,
      updateOrgId,
    } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ success: false, error: 'User ID and target role are required.' });
    }

    const result = backendDb.updateUserRoleWithHistory({
      userId,
      email,
      newRole,
      changedBy: adminEmail,
      operatorRole: adminUser?.role,
      reason,
      qualification,
      specialization,
      yearsOfExperience: Number(yearsOfExperience) || undefined,
      expertise: Array.isArray(expertise) ? expertise : typeof expertise === 'string' ? expertise.split(',').map((s: string) => s.trim()) : undefined,
      skills: Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()) : undefined,
      availability,
      coursesCanTeach: Array.isArray(coursesCanTeach) ? coursesCanTeach : typeof coursesCanTeach === 'string' ? coursesCanTeach.split(',').map((s: string) => s.trim()) : undefined,
      updateOrgId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const targetEmail = result.user?.email || email;
    await syncRoleToSupabase(userId, newRole, targetEmail);

    return res.json({
      success: true,
      message: `User role successfully updated to ${newRole.toUpperCase()}.`,
      user: result.user,
    });
  });

  // Update user role (backward compatible endpoint)
  app.post('/api/admin/users/role', verifyAdmin, async (req, res) => {
    const adminEmail = (req.headers['x-admin-email'] as string) || 'admin@learnai.com';
    const adminUser = backendDb.getUserByEmail(adminEmail);
    const { userId, newRole, email, reason, qualification, specialization, yearsOfExperience, expertise, skills, availability, updateOrgId } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ error: 'User ID and new role are required.' });
    }

    const result = backendDb.updateUserRoleWithHistory({
      userId,
      email,
      newRole,
      changedBy: adminEmail,
      operatorRole: adminUser?.role,
      reason: reason || `Updated to ${newRole} via admin panel`,
      qualification,
      specialization,
      yearsOfExperience: Number(yearsOfExperience) || undefined,
      expertise,
      skills,
      availability,
      updateOrgId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const targetEmail = result.user?.email || email;
    await syncRoleToSupabase(userId, newRole, targetEmail);

    res.json({ success: true, message: `User role successfully updated to ${newRole.toUpperCase()}.` });
  });

  // Toggle user suspension
  app.post('/api/admin/users/status', verifyAdmin, (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }
    const result = backendDb.toggleUserSuspension(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'User status successfully modified.' });
  });

  // Delete user permanently
  app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const result = backendDb.deleteUserPermanently(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'User permanently removed from all databases.' });
  });

  // Reset Platform to First-Time Admin Bootstrap (For Testing / Evaluation)
  app.post('/api/admin/reset-bootstrap', verifyAdmin, (_req, res) => {
    backendDb.resetToFirstAdminBootstrap();
    res.json({
      success: true,
      message: 'Platform reset to initial First Admin Setup state. No administrator accounts exist.',
    });
  });

  // Seed sample students, mentors, trainers for testing
  app.post('/api/admin/seed-demo-data', verifyAdmin, (_req, res) => {
    backendDb.seedSampleData();
    res.json({
      success: true,
      message: 'Sample students, mentors, trainers, and verification codes seeded successfully.',
    });
  });

  // ========================================================
  // AI Learning Assistant Server-Side Route
  // ========================================================
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const { message, history, courseContext } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        const fallbackAnswers: Record<string, string> = {
          python: `In Python, key concepts to master include:
1. **Data Structures**: Lists, Dictionaries, Sets, and Tuples.
2. **Functions**: First-class functions, *args/**kwargs, and lambda expressions.
3. **OOP**: Classes, inheritance, and dunder methods (__init__, __str__).
*Tip: Practice writing unit tests using pytest to reinforce your logic.*`,
          machine: `Machine Learning foundational pillars:
1. **Supervised Learning**: Regression & Classification.
2. **Unsupervised Learning**: Clustering (K-Means, DBSCAN) & Dimensionality Reduction (PCA).
3. **Model Evaluation**: Precision, Recall, F1-score, and ROC-AUC.`,
          sql: `Essential SQL skills for student success:
1. **JOIN Operations**: INNER JOIN vs LEFT/RIGHT JOIN.
2. **Aggregations & Grouping**: GROUP BY and aggregate functions (COUNT, SUM, AVG).
3. **Window Functions**: ROW_NUMBER(), RANK(), and PARTITION BY.`,
          generative: `Generative AI & LLM core concepts:
1. **Transformer Architecture**: Self-attention mechanisms, encoders, and decoders.
2. **Prompt Engineering**: Zero-shot, Few-shot, and Chain-of-Thought (CoT).
3. **RAG (Retrieval-Augmented Generation)**: Vector embeddings and contextual grounding.`,
        };

        const lowerMsg = message.toLowerCase();
        let fallbackTopic = '';
        if (lowerMsg.includes('python')) fallbackTopic = fallbackAnswers.python;
        else if (lowerMsg.includes('machine') || lowerMsg.includes('ml')) fallbackTopic = fallbackAnswers.machine;
        else if (lowerMsg.includes('sql') || lowerMsg.includes('query') || lowerMsg.includes('database')) fallbackTopic = fallbackAnswers.sql;
        else if (lowerMsg.includes('generative') || lowerMsg.includes('ai') || lowerMsg.includes('llm') || lowerMsg.includes('prompt')) fallbackTopic = fallbackAnswers.generative;

        const defaultReply = fallbackTopic ||
          `Great question! In our learning path, this relates to breaking down the problem systematically. 
1. Identify the core concepts and inputs/outputs.
2. Draft a pseudocode implementation.
3. Test edge cases and review time/space efficiency.

Feel free to ask a specific question about Python, SQL, Machine Learning, or Generative AI!`;

        return res.json({
          reply: defaultReply,
          model: 'offline-preview',
          disclaimer: 'Generated via educational preview mode. Connect GEMINI_API_KEY in Secrets for live multimodal generation.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are the AI Learning Assistant for "LearnAI - AI Student Learning & Career Success Platform" (Tagline: "Learn Smarter. Practice Better. Build Your Career.").
Your goal is to assist students enrolled in technical courses (Python Programming, Machine Learning Fundamentals, Generative AI Fundamentals, and SQL Fundamentals).
Keep responses focused, well-formatted using Markdown (bolding, lists, code blocks).`;

      const contents = [
        ...(Array.isArray(history)
          ? history.slice(-6).map((h: any) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: String(h.text || h.message || '') }],
            }))
          : []),
        {
          role: 'user',
          parts: [
            {
              text: courseContext
                ? `[Context - Active Course: ${courseContext}]\nStudent question: ${message}`
                : `Student question: ${message}`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || 'I could not generate a response. Please try again.';
      return res.json({ reply: text, model: 'gemini-3.8-flash' });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return res.status(500).json({
        error: 'Unable to connect to AI Assistant right now.',
        details: error?.message || 'Unknown server error',
      });
    }
  });

  // Contact form submission endpoint
  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    return res.json({
      success: true,
      message: 'Thank you! Your message has been submitted successfully.',
      receivedAt: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnAI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
