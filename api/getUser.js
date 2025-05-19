import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Dùng service role để insert/update
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, username, first_name } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!id || !first_name) {
    return res.status(400).json({ message: 'Thiếu thông tin người dùng' });
  }

  // Tạo hoặc cập nhật user trong bảng
  const { data, error } = await supabase
    .from('users')
    .upsert({
      user_id: id.toString(),
      coin: 0,
      energy: 500
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Lỗi Supabase:', error);
    return res.status(500).json({ message: 'Lỗi khi lưu dữ liệu' });
  }

  res.status(200).json({ message: 'Lưu thành công', data });
}
