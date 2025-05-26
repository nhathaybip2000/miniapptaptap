import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, email, password, ref_by } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng ký' });
  }

  // Kiểm tra username hoặc email đã tồn tại chưa
  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`);

  if (checkError) return res.status(500).json({ error: checkError.message });
  if (existing.length > 0) return res.status(400).json({ error: 'Username hoặc email đã tồn tại' });

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, email, password, ref_by }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Đăng ký thành công', user: data });
}
