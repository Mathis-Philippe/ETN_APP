import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wjblfsrgavyqkcakkwdr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYmxmc3JnYXZ5cWtjYWtrd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzA2MTIsImV4cCI6MjA3NDIwNjYxMn0.uKc7_juDl-GHT5J11yZ4umj2yCbbe9VUKA0hExNouhQ"; // ta clé anon publique

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;