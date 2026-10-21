import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhilfeaqwnlancoatbcf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoaWxmZWFxd25sYW5jb2F0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NDQ4NTUsImV4cCI6MjEwODAyMDg1NX0.Fi6DuSO4UOMa-ooPN5_VdUx6IdzmOtJa1_zzVhXMgiw'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
