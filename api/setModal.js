import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, modal } = req.body;

  if (!id || !['yes', 'no'].includes(modal)) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  const { error } = await supabase
    .from('users')
    .update({ modal })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
