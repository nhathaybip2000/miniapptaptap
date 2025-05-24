import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
  }

  const { user_id, bank_account, receiver_name, bank_name, amount } = req.body;

  if (!user_id || !bank_account || !receiver_name || !bank_name || !amount || amount < 1000) {
    return res.status(400).json({ error: 'Thiếu thông tin hoặc số tiền không hợp lệ' });
  }

  // Trừ xu
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('coin')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    return res.status(400).json({ error: 'Không tìm thấy người dùng' });
  }

  if (user.coin < amount) {
    return res.status(400).json({ error: 'Không đủ xu' });
  }

  // Ghi yêu cầu rút
  const { error: insertError } = await supabase.from('withdraws').insert([{
    user_id,
    bank_account,
    receiver_name,
    bank_name,
    amount,
    status: 'pending'
  }]);

  if (insertError) {
    return res.status(500).json({ error: 'Lỗi ghi yêu cầu rút' });
  }

  // Trừ xu
  await supabase
    .from('users')
    .update({ coin: user.coin - amount })
    .eq('id', user_id);

  return res.status(200).json({ success: true });
}
