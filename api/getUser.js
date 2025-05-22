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
    const { data: existing, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    // ❗ Nếu user đã tồn tại
    if (existing) {
      if (validRef && !existing.ref_by) {
        await supabase
          .from('users')
          .update({ ref_by })
          .eq('id', id);
      }
    
      // Lấy lại dữ liệu mới nhất sau khi update
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    
      return res.status(200).json(updatedUser);
    }
    

    // Nếu lỗi không phải vì không tìm thấy
    if (getError && getError.code !== 'PGRST116') {
      return res.status(500).json({ error: getError.message });
    }

    // Tạo user mới
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
        ref_by: null, 
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
