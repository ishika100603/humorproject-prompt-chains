// Public Supabase settings. The anon key is meant to be public (it ships to every
// browser); the real protection is Row Level Security plus profiles.is_superadmin.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kclrpjpuavpxckunmisn.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbHJwanB1YXZweGNrdW5taXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjQyMjMsImV4cCI6MjEwNjkwMDIyM30.aX08pESOlSZCzIMX4Ef3kXdJnPw_0MINqigud3MZHQI";

// The public caption app holds the Gemini key and runs chains for this tool
export const CAPTION_APP_URL = process.env.NEXT_PUBLIC_CAPTION_APP_URL || "https://humorproject-three.vercel.app";
