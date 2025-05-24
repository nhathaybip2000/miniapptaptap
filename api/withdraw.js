// /api/withdraw.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, account, name, bank, amount } = req.body;

  if (!id || !account || !name || !bank || !amount || amount < 1000) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  try {
    // Lấy số dư hiện tại
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coin')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (user.coin < amount) {
      return res.status(400).json({ error: 'Không đủ xu để rút' });
    }

    // Trừ xu trong bảng users
    const { error: updateError } = await supabase
      .from('users')
      .update({ coin: user.coin - amount })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ error: 'Lỗi khi trừ xu' });
    }

    // Thêm vào bảng withdraws
    const { error: insertError } = await supabase
      .from('withdraws')
      .insert([
        {
          user_id: id,
          account,
          name,
          bank,
          amount,
          status: 'pending', // mặc định chờ xử lý
        },
      ]);

    if (insertError) {
      return res.status(500).json({ error: 'Không thể tạo yêu cầu rút tiền' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
}
