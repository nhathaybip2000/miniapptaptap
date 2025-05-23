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
    // Lấy danh sách bạn bè được mời (bao gồm coin)
    const { data: referrals, error: refError } = await supabase
      .from('users')
      .select('id, first_name, coin')
      .eq('ref_by', id);

    if (refError) {
      return res.status(500).json({ error: refError.message });
    }

    // Lấy ref_bonus của người dùng chính
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('ref_bonus')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(500).json({ error: 'Không thể lấy thông tin người dùng' });
    }

    return res.status(200).json({
      list: referrals,
      ref_bonus: user.ref_bonus || 0
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
