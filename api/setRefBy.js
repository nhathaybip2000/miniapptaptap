import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, ref_by } = req.body;

  if (!id || !ref_by || id === ref_by) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  // Kiểm tra người dùng hiện tại đã có ref_by chưa
  const { data: me, error: getMeError } = await supabase
    .from('users')
    .select('ref_by')
    .eq('id', id)
    .single();

  if (getMeError || !me) {
    return res.status(404).json({ error: 'Không tìm thấy user' });
  }

  if (me.ref_by) {
    return res.status(400).json({ error: 'Bạn đã có người giới thiệu rồi' });
  }

  // Kiểm tra người mời có tồn tại không
  const { data: parent, error: parentError } = await supabase
    .from('users')
    .select('coin, ref_bonus')
    .eq('id', ref_by)
    .single();

  if (parentError || !parent) {
    return res.status(400).json({ error: 'ID người mời không tồn tại' });
  }

  // Cập nhật ref_by cho người dùng hiện tại và cộng thưởng cho người mời
  const { error: updateError } = await supabase
    .from('users')
    .update({ ref_by: ref_by })
    .eq('id', id);

  const bonus = 100; // 🎁 số xu thưởng cho người mời

  const { error: bonusError } = await supabase
    .from('users')
    .update({
      coin: parent.coin + bonus,
      ref_bonus: (parent.ref_bonus || 0) + bonus
    })
    .eq('id', ref_by);

  if (updateError || bonusError) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật Supabase' });
  }

  return res.status(200).json({ success: true });
}
