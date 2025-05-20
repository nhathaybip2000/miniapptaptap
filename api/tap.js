// api/tap.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, count } = req.body;

  if (!id || !count) return res.status(400).json({ error: 'Thiếu id hoặc count' });

  const { data: user, error } = await supabase
    .from('users')
    .select('coin')
    .eq('id', id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'Không tìm thấy user' });
  }

  const newCoin = user.coin + count;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('users')
    .update({ coin: newCoin, last_tap_at: now })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật coin' });
  }

  res.status(200).json({ coin: newCoin, last_tap_at: now });
}
