// /api/upgrade.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, tapLevel, energyLevel } = req.body;

  if (!id) return res.status(400).json({ error: 'Thiếu user ID' });

  const { error } = await supabase
    .from('users')
    .update({
      ...(tapLevel !== undefined && { tap_level: tapLevel }),
      ...(energyLevel !== undefined && { energy_level: energyLevel }),
    })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}
