function conectabd() {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";
  
    const supabase = createClient(supabaseUrl, supabaseKey);
  
    return supabase;
  }
  
  module.exports = conectabd;