import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
    .eq('password', password)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  if (users.length === 0) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });

  res.status(200).json({ message: 'Đăng nhập thành công', user: users[0] });
}
