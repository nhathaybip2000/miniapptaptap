import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id, ref_by } = req.body;

  if (!id || !ref_by || id === ref_by) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  // Kiểm tra ref_by có tồn tại không
  const { data: refUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', ref_by)
    .single();

  if (!refUser) {
    return res.status(404).json({ error: 'Mã mời không tồn tại' });
  }

  // Cập nhật nếu chưa có ref_by
  const { data: user } = await supabase
    .from('users')
    .select('ref_by')
    .eq('id', id)
    .single();

  if (user?.ref_by) {
    return res.status(400).json({ error: 'Bạn đã nhập mã mời rồi' });
  }

  const { error } = await supabase
    .from('users')
    .update({ ref_by })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Cập nhật mã mời thành công' });
}
