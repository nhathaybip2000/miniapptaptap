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
      .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level, ref_by, ref_bonus')
      .eq('id', id)
      .single();

    // Nếu người dùng đã tồn tại
    if (existing) {
      const validRef = ref_by && ref_by !== id && !existing.ref_by;
      console.log('[DEBUG] User tồn tại:', id, 'ref_by gửi lên:', ref_by, 'validRef:', validRef);
    
      if (validRef) {
        const { error: updateRefErr } = await supabase
          .from('users')
          .update({ ref_by: ref_by })
          .eq('id', id);
          
        if (updateRefErr) {
          console.error('[ERROR] Không thể update ref_by:', updateRefErr.message);
        } else {
          console.log('[SUCCESS] Đã cập nhật ref_by cho user:', id);
        }
    
        existing.ref_by = ref_by;
      }
    
      return res.status(200).json(existing);
    }
    

    // Nếu lỗi không phải do không tìm thấy thì trả lỗi
    if (getError && getError.code !== 'PGRST116') {
      return res.status(500).json({ error: getError.message });
    }

    // ✅ Nếu là người dùng mới → tạo mới
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
      .select('id, username, first_name, coin, last_tap_at, tap_level, energy_level, ref_by, ref_bonus')
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
