// lib/btechbuddy-api.js
// ------------------------------------------------------------
// Real backend functions for BtechBuddy — replaces the mock
// useState-based resources/auth in the UI component.
// Every function below maps 1:1 to something the UI already
// calls (addResource, updateResource, deleteResource, login,
// signup, admin login) — just swap the mock handlers for these.
// ------------------------------------------------------------
import { supabase } from "./supabaseClient";

/* ============================ AUTH ============================ */

// Student signup — creates an auth user + profile row (via DB trigger)
export async function studentSignUp({ email, password, fullName, branch, year }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, branch, year }, // read by handle_new_user() trigger
    },
  });
  if (error) throw error;
  return data.user;
}

// Student login
export async function studentSignIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// Admin login — same Supabase Auth, but we additionally verify
// the profile's role = 'admin' after signing in. If not admin,
// we sign the session back out so a student account can't sneak
// into /admin by hitting this form.
export async function adminSignIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw profileError;

  if (profile.role !== "admin") {
    await supabase.auth.signOut();
    throw new Error("This account does not have admin access.");
  }
  return { user: data.user, profile };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Call once on app load to restore an existing session (e.g. after refresh)
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getMyProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  if (error) throw error;
  return data;
}

/* ========================= RESOURCES (read) ========================= */

// Fetch resources filtered the same way the student UI filters them
export async function fetchResources({ branch, year, category }) {
  let query = supabase.from("resources").select("*").order("created_at", { ascending: false });
  if (branch) query = query.eq("branch", branch);
  if (year) query = query.eq("year", year);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Fetch everything for the Admin "Manage Resources" table
export async function fetchAllResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/* ========================= RESOURCES (write) ========================= */

// Upload a PDF file to Storage and return its public URL + path
async function uploadPdfFile(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("resource-pdfs")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("resource-pdfs").getPublicUrl(path);
  return { url: publicUrlData.publicUrl, path };
}

// Add a resource — handles both PDF (uploads file first) and YouTube (just stores link)
export async function addResource({
  title, subject, code, category, branch, year, sem, type, youtubeUrl, pdfFile,
}) {
  let link = youtubeUrl;
  let filePath = null;

  if (type === "pdf") {
    if (!pdfFile) throw new Error("No PDF file selected.");
    const uploaded = await uploadPdfFile(pdfFile);
    link = uploaded.url;
    filePath = uploaded.path;
  }

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title, subject, code, category, branch, year, sem, type,
      link, file_path: filePath, uploaded_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Edit title only
export async function updateResourceTitle(id, newTitle) {
  const { data, error } = await supabase
    .from("resources")
    .update({ title: newTitle })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Replace a resource's link — for YouTube just swaps the URL;
// for PDFs, pass a new File to actually replace the storage object.
export async function replaceResourceLink(id, { newLink, newPdfFile, oldFilePath }) {
  let link = newLink;
  let filePath = oldFilePath ?? null;

  if (newPdfFile) {
    if (oldFilePath) {
      await supabase.storage.from("resource-pdfs").remove([oldFilePath]);
    }
    const uploaded = await uploadPdfFile(newPdfFile);
    link = uploaded.url;
    filePath = uploaded.path;
  }

  const { data, error } = await supabase
    .from("resources")
    .update({ link, file_path: filePath })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete a resource (and its file from Storage, if it has one)
export async function deleteResource(id, filePath) {
  if (filePath) {
    await supabase.storage.from("resource-pdfs").remove([filePath]);
  }
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw error;
}

/* ===================== REALTIME (optional, nice touch) ===================== */
// Subscribe so the student portal updates live the instant an
// admin publishes something — no refresh needed.
export function subscribeToResources(onChange) {
  const channel = supabase
    .channel("resources-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, onChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}
