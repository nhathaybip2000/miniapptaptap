import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    // Lấy danh sách người được giới thiệu
    const { data: referrals, error } = await supabase
      .from('users')
      .select('id, first_name, ref_bonus')
      .eq('ref_by', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalBonus = referrals.reduce((sum, r) => sum + (r.ref_bonus || 0), 0);

    return res.status(200).json({
      list: referrals,
      total_bonus: totalBonus
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
