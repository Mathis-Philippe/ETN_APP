import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config();

// Utilisation des variables d'environnement définies sur Render
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("⚠️ Supabase URL ou Key manquante sur le serveur !");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;