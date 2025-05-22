import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ hỗ trợ phương thức POST' });
  }

  const { id } = req.body;

  if (!id || typeof id !== 'number') {
    return res.status(400).json({ error: 'ID người dùng không hợp lệ' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, ref_bonus')
      .eq('ref_by', id)
      .order('id', { ascending: false });

    if (error) {
      console.error('Lỗi Supabase:', error);
      return res.status(500).json({ error: 'Không thể lấy danh sách mời' });
    }

    const total_bonus = data.reduce((sum, u) => sum + (u.ref_bonus || 0), 0);

    return res.status(200).json({
      list: data.map(u => ({
        id: u.id,
        username: u.username,
        first_name: u.first_name || 'Người dùng',
        ref_bonus: u.ref_bonus || 0
      })),
      total_bonus
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
}
