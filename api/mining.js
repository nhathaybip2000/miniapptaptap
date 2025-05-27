// pages/api/mining.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, tcd_balance, speed_level, production_level } = req.body;

  const { error } = await supabase
    .from("users")
    .update({ tcd_balance, speed_level, production_level })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: "Cập nhật thành công" });
}
