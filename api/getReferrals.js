import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, coin, created_at')
      .eq('ref_by', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ referrals: data });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
