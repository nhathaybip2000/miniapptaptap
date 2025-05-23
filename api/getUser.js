import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, first_name, username } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    // Tìm user đã tồn tại
    const { data: existing, error: getError } = await supabase
      .from('users')
      .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level, ref_by, ref_bonus, modal')
      .eq('id', id)
      .single();

    if (existing) {
      return res.status(200).json(existing);
    }

    // Nếu không tìm thấy (lỗi code PGRST116) thì tạo mới
    if (getError && getError.code !== 'PGRST116') {
      return res.status(500).json({ error: getError.message });
    }

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert([{
        id,
        first_name,
        username,
        coin: 0,
        last_tap_at: null,
        tap_level: 1,
        energy_level: 1
      }])
      .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level, ref_by, ref_bonus, modal')
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json(created);

  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}