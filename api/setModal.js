import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ modal: 'yes' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Lỗi khi cập nhật modal' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
