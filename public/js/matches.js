const {
  data: { user },
  error: userError
} = await supabase.auth.getUser();

console.log("Current user:", user);
console.log("User error:", userError);

import { supabase } from "./supabase-client.js";

async function loadMatches() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  console.log("Current user:", user);

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  if (error) {
    console.error("Error loading matches:", error);
    return;
  }

  console.log("Matches:", data);
}

loadMatches();