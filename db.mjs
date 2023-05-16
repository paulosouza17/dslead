// IMPORTA POSTGREE
import pkg from 'pg';


// DB USADA SUPABASE.COM
const { Client } = pkg;
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from "@react-native-async-storage/async-storage";



const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";

const supabase = createClient(supabaseUrl, supabaseKey);

// const getUsuarios = async () => {
//   const { data, error } = await supabase.from('usuario').select('*').limit(5);
//   if (error) {
//     console.error(error);
//     return null;
//   }
//   return data;
// };

// const main = async () => {
//   const usuarios = await getUsuarios();
//   console.log(JSON.stringify(usuarios));
// };

// main();