import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, ref_by } = req.body;

  if (!id || !ref_by || id === ref_by) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  const { data: user, error: getError } = await supabase
    .from('users')
    .select('ref_by')
    .eq('id', id)
    .single();

  if (getError || !user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  if (user.ref_by) {
    return res.status(400).json({ error: 'Bạn đã nhập mã mời trước đó!' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ ref_by })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ error: 'Cập nhật thất bại' });
  }

  return res.status(200).json({ success: true });
}
