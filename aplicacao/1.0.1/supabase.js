require('dotenv').config();

function conectabd() {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Conexão efetuada")
    return supabase;
}

module.exports = conectabd;