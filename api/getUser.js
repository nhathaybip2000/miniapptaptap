import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  // ✅ Lấy user cũ – chọn đầy đủ các trường cần thiết
  const { data: existing, error: getError } = await supabase
    .from('users')
    .select('id, username, first_name, coin, energy, last_tap_at') // ← thêm 'energy'
    .eq('id', id)
    .single();

  if (getError && getError.code !== 'PGRST116') {
    return res.status(500).json({ error: getError.message });
  }

  // Nếu đã có user → trả về
  if (existing) return res.status(200).json(existing);

  // Nếu chưa có → tạo mới
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert([{
      id,
      first_name,
      username,
      coin: 0,
      energy: 500,           // ← thêm energy mặc định
      last_tap_at: null
    }])
    .select('id, username, first_name, coin, energy, last_tap_at') // ← thêm 'energy'
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json(created);
}
