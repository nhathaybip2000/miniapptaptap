import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  if (!id) return res.status(400).json({ error: 'Thiếu ID người dùng' });

  // ✅ Tìm user đã tồn tại
  const { data: existing, error: getError } = await supabase
    .from('users')
    .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level')
    .eq('id', id)
    .single();

  // ❌ Nếu lỗi không phải do "không tìm thấy" thì trả lỗi
  if (getError && getError.code !== 'PGRST116') {
    return res.status(500).json({ error: getError.message });
  }

  // ✅ Nếu user đã tồn tại
  if (existing) return res.status(200).json(existing);

  // 🆕 Nếu user chưa tồn tại, tạo mới user
// Nếu chưa có → tạo mới
const { data: created, error: insertError } = await supabase
  .from('users')
  .insert([{
    id,
    first_name,
    username,
    coin: 0,
    last_tap_at: null,
    tap_level: 1,       // 👈 thêm mặc định
    energy_level: 1     // 👈 thêm mặc định
  }])
  .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level')
  .single();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(200).json(created);
}
