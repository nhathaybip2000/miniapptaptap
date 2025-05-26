// /api/register.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { username, email, password} = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
  }

  // Kiểm tra xem username hoặc email đã tồn tại chưa
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`);

  if (existingUsers.length > 0) {
    return res.status(400).json({ message: 'Email hoặc Username đã tồn tại.' });
  }

  // Chèn user mới
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        email,
        password, // 🔒 Bạn nên mã hóa password sau này bằng bcrypt
        created_at: new Date().toISOString(),
        tcd_balance: 0,
        vndc_balance: 0,
        speed_level: 1,
        production_level: 1
      },
    ])
    .select();

  if (error) {
    console.error('Insert Error:', error);
    return res.status(500).json({ message: 'Lỗi khi lưu dữ liệu.' });
  }

  res.status(200).json({ message: 'Đăng ký thành công', user: data[0] });
}
