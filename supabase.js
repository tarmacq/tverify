// supabase.js
const supabase = window.supabase.createClient(
  'https://lxtaitbzpvdzyonxhfmm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGFpdGJ6cHZkenlvbnhoZm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTA3ODIsImV4cCI6MjA3NDkyNjc4Mn0.gNIq2oJFbKgz7TayICLi6djNB_j2PxAlAZYyE0s5amM',
  {
    auth: {
      flowType: 'pkce', // enables secure redirect flow
      detectSessionInUrl: true // auto-handles callback
    }
  }
);
