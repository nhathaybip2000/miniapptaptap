import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, first_name, username, ref_by } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    // Tìm user có tồn tại chưa
    const { data: existingUser, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // ✅ dùng maybeSingle thay vì single để tránh lỗi logic

    if (getError) {
      return res.status(500).json({ error: getError.message });
    }

    if (existingUser) {
      // ✅ Nếu user tồn tại nhưng chưa có ref_by thì cập nhật
      if (!existingUser.ref_by && ref_by && ref_by !== id) {
        await supabase
          .from('users')
          .update({ ref_by })
          .eq('id', id);
      }
      return res.status(200).json(existingUser);
    }

    // Tạo user mới nếu chưa tồn tại
    const validRef = ref_by && ref_by !== id;

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert([{
        id,
        first_name,
        username,
        coin: 0,
        last_tap_at: null,
        tap_level: 1,
        energy_level: 1,
        ref_by: validRef ? ref_by : null,
        ref_bonus: 0
      }])
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json(created);

  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
