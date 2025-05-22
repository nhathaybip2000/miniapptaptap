import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ hỗ trợ POST' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, ref_bonus')
      .eq('ref_by', id)
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // ✅ Tính tổng xu thưởng từ các người bạn mời
    const total_bonus = data.reduce((sum, user) => sum + (user.ref_bonus || 0), 0);

    return res.status(200).json({
      list: data,
      total_bonus
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
