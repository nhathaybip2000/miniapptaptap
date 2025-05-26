// /api/register.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email, password, referral } = req.body;

  // Kiểm tra đầu vào
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
  }

  // Kiểm tra tồn tại
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`);

  if (checkError) {
    console.error('Check Error:', checkError);
    return res.status(500).json({ message: 'Lỗi kiểm tra người dùng.' });
  }

  if (existingUsers.length > 0) {
    return res.status(400).json({ message: 'Email hoặc Username đã tồn tại.' });
  }

  // Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Thêm người dùng mới
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        tcd_balance: 0,
        vndc_balance: 0,
        speed_level: 1,
        production_level: 1,
        referral: referral || null
      }
    ])
    .select();

  if (error) {
    console.error('Insert Error:', error);
    return res.status(500).json({ message: 'Lỗi khi lưu dữ liệu.' });
  }

  // Trả về user (ẩn mật khẩu)
  const user = data[0];
  delete user.password;

  res.status(200).json({ message: 'Đăng ký thành công', user });
}
