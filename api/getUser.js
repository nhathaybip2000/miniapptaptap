import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id, name, coin } = req.body;

    const { error } = await supabase
      .from('users')
      .upsert({ id, name, coin }); // Thêm mới hoặc cập nhật

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: 'Lưu thành công' });
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Không tìm thấy user' });

    return res.status(200).json(data);
  }

  res.status(405).end();
}
