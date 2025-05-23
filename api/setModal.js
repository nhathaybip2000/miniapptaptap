import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID người dùng' });

  const { error } = await supabase
    .from('users')
    .update({ modal: 'yes' })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}
