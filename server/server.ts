import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

type UserData = {
  id: string;
  email: string;
  role: 'mother' | 'doctor' | 'admin';
  created_at: string;
  updated_at: string;
  last_seen: string | null;
};

interface ChatMessage {
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

dotenv.config();

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    id: string;
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

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Service Role Key');
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) as any;

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

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, userData, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: { role }
    });

    if (authError || !authUser.user) {
      console.error('Auth error:', authError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create user in public.users
    const now = new Date().toISOString();
    const { error: userError } = await supabase
    .from('users')
    .insert({
    id: authUser.user.id,
    email,
    role,
    created_at: now,
    updated_at: now,
    last_seen: now
   } satisfies Database['public']['Tables']['users']['Insert'])
   .select()
   .single();

    if (userError) {
      console.error('User creation error:', userError);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    // Create role-specific profile
    if (role === 'mother') {
      const { error: profileError } = await supabase
        .from('mother_profiles')
        .insert({
          user_id: authUser.user.id,
          ...userData,
          created_at: now,
          updated_at: now
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(500).json({ error: 'Failed to create mother profile' });
      }
    } else if (role === 'doctor') {
      const { error: profileError } = await supabase
        .from('doctor_profiles')
        .insert({
          user_id: authUser.user.id,
          ...userData,
          created_at: now,
          updated_at: now
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(500).json({ error: 'Failed to create doctor profile' });
      }
    }

    // Generate JWT token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData) {
      console.error('Session error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: authUser.user.id,
      email: authUser.user.email,
      role,
      session: sessionData
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// Protected route example
app.get('/api/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile based on role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single() as { data: UserData | null; error: any };

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (userData.role === 'mother') {
      const { data, error: profileError } = await supabase
        .from('mother_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    } else if (userData.role === 'doctor') {
      const { data, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: userData.role,
      profile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    next(error);
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for private messages
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Handle chat messages
  socket.on('send-message', async (data: { 
    roomId: string; 
    message: string; 
    senderId: string 
  }) => {
    try {
      const { roomId, message, senderId } = data;
      
      // Save message to database
      const messageData: Database['public']['Tables']['chat_messages']['Insert'] = {
      room_id: roomId,
      sender_id: senderId,
      content: message,
      created_at: new Date().toISOString(),
      read: false
    };

    const { data: savedMessage, error } = await supabase
      .from('chat_messages')
      .insert([{ 
      room_id: roomId,
      sender_id: senderId,
      content: message,
      created_at: new Date().toISOString(),
      read: false
    }])
      .select()
      .single();

      if (error) throw error;

      // Broadcast to room
      io.to(roomId).emit('receive-message', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
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

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
