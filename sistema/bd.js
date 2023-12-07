const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddetzticziwporqefzze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZXR6dGljeml3cG9ycWVmenplIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk2NDIyOTQsImV4cCI6MjAwNTIxODI5NH0.hx8YHa_pc7g_Z1r6ba58jzE700NaFWOlXdE4gdyaG74';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;