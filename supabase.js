
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxtaitbzpvdzyonxhfmm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGFpdGJ6cHZkenlvbnhoZm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTA3ODIsImV4cCI6MjA3NDkyNjc4Mn0.gNIq2oJFbKgz7TayICLi6djNB_j2PxAlAZYyE0s5amM'
const supabase = createClient(supabaseUrl, supabaseKey)
