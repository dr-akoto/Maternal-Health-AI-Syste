import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Types
type UserRole = 'mother' | 'doctor' | 'admin';

interface AuthenticatedRequest extends Request {
  id: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    id: string;
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
});

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  throw new Error('Missing Supabase configuration');
}

// Client for auth operations (uses anon key)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin client for privileged operations (uses service role key if available)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseAuth;

console.log('🔑 Service Role Key:', supabaseServiceKey ? 'CONFIGURED' : 'NOT SET (using anon key)');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = uuidv4();
  next();
});

// Auth middleware for protected routes
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as UserRole) || 'mother'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

// POST /api/auth/login - Sign in user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error.message);
      return res.status(401).json({ error: error.message });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Login failed' });
    }

    // Get user profile
    const role = data.user.user_metadata?.role as UserRole || 'mother';
    let profile = null;

    if (role === 'mother') {
      const { data: motherData } = await supabaseAuth
        .from('mother_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      profile = motherData;
    } else if (role === 'doctor') {
      const { data: doctorData } = await supabaseAuth
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      profile = doctorData;
    } else if (role === 'admin') {
      const { data: adminData } = await supabaseAuth
        .from('admin_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      profile = adminData;
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        profile
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register - Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, fullName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRole: UserRole = role || 'mother';

    // Create user with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userRole,
          full_name: fullName || email.split('@')[0],
          phone: phone || ''
        }
      }
    });

    if (error) {
      console.error('Registration error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Registration failed' });
    }

    // Create profile in appropriate table
    const profileName = fullName || email.split('@')[0];
    let profileError = null;

    if (userRole === 'mother') {
      const { error } = await supabaseAdmin
        .from('mother_profiles')
        .insert({
          user_id: data.user.id,
          full_name: profileName,
          phone: phone || null
        });
      profileError = error;
    } else if (userRole === 'doctor') {
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .insert({
          user_id: data.user.id,
          full_name: profileName,
          phone: phone || 'Not provided',
          license_number: `PENDING-${data.user.id.slice(0, 8)}`,
          specialization: 'General'
        });
      profileError = error;
    }

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail registration if profile creation fails - user can create it later
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      } : null
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Sign out user
app.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await supabaseAuth.auth.signOut();
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh - Refresh access token
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token
    });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Failed to refresh token' });
    }

    res.status(200).json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Token is required' });
    }

    const { error } = await supabaseAuth.auth.updateUser({ password });

    if (error) {
      console.error('Password update error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// PROFILE ROUTES
// ==========================================

// GET /api/profile - Get current user profile
app.get('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let profile = null;

    if (role === 'mother') {
      const { data, error } = await supabaseAuth
        .from('mother_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      profile = data;
    } else if (role === 'doctor') {
      const { data, error } = await supabaseAuth
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      profile = data;
    } else if (role === 'admin') {
      const { data, error } = await supabaseAuth
        .from('admin_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      profile = data;
    }

    res.status(200).json({
      user: {
        id: userId,
        email: req.user!.email,
        role
      },
      profile
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update current user profile
app.put('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    let result;
    const table = role === 'mother' ? 'mother_profiles' 
                : role === 'doctor' ? 'doctor_profiles'
                : 'admin_profiles';

    const { data, error } = await supabaseAuth
      .from(table)
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: data
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profile/create - Create profile for existing user
app.post('/api/profile/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { fullName, phone } = req.body;

    const profileName = fullName || req.user!.email.split('@')[0];
    let profile = null;

    if (role === 'mother') {
      const { data, error } = await supabaseAdmin
        .from('mother_profiles')
        .insert({
          user_id: userId,
          full_name: profileName,
          phone: phone || null
        })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else if (role === 'doctor') {
      const { data, error } = await supabaseAdmin
        .from('doctor_profiles')
        .insert({
          user_id: userId,
          full_name: profileName,
          phone: phone || 'Not provided',
          license_number: `PENDING-${userId.slice(0, 8)}`,
          specialization: 'General'
        })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (error: any) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// ==========================================
// NOTIFICATIONS ROUTES
// ==========================================

// GET /api/notifications - Get user notifications
app.get('/api/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAuth
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      notifications: data || [],
      unread_count: (data || []).filter((n: any) => !n.read).length
    });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
app.put('/api/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabaseAuth
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ==========================================
// WEBSOCKET HANDLERS
// ==========================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('send-message', async (data: { 
    roomId: string; 
    message: string; 
    senderId: string;
    token: string;
  }) => {
    try {
      const { roomId, message, senderId, token } = data;
      
      // Verify token
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user || user.id !== senderId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Save message to database
      const messageData = {
        room_id: roomId,
        sender_id: senderId,
        content: message,
        created_at: new Date().toISOString(),
        read: false
      };

      const { data: savedMessage, error } = await supabaseAuth
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      // Broadcast to room
      io.to(roomId).emit('receive-message', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user-typing', { userId: data.userId });
  });

  socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user-stop-typing', { userId: data.userId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
