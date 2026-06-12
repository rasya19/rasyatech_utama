import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Setup nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== TARO SEMUA ROUTE API BAPAK DI SINI =====

app.post("/api/register-tenant", async (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) return res.status(500).json({ error: "Server config missing" });
  
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  // ... sisa kode registerTenant Bapak
  res.json({ success: true });
});

app.get("/api/check-subdomain", async (req, res) => {
  // ... kode check subdomain Bapak
});

app.post("/api/register-school", async (req, res) => {
  // ... kode register school Bapak
});

app.post("/api/verify-school", async (req, res) => {
  // ... kode verify school Bapak  
});

app.delete("/api/delete-registration", async (req, res) => {
  // ... kode delete Bapak
});

// ===== WAJIB ADA DI PALING BAWAH =====
export default app;
