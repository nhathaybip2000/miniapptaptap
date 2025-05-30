import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });
  }

  // Truy vấn user kèm theo role
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, email, password, role, tcd_balance, vndc_balance') // chỉ chọn các trường cần thiết
    .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
    .limit(1)
    .single();

  if (error || !users) {
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  }

  // Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, users.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  }

  // Xóa password trước khi trả về client
  delete users.password;

  // ✅ Trả về cả role trong thông tin user
  return res.status(200).json({
    message: 'Đăng nhập thành công',
    user: users, // chứa cả role
  });
}
