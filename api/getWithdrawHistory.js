// /api/getWithdrawHistory.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID người dùng' });
  }

  try {
    const { data, error } = await supabase
      .from('withdraws')
      .select('account, name, bank, amount, status, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
    }

    return res.status(200).json({ list: data });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
