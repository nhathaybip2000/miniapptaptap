// /api/getUser.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/', async (req, res) => {
  const { id, username, first_name } = req.body;

  // Kiểm tra nếu user đã có
  let { data, error } = await supabase
    .from('users')
    .select('coin, energy')
    .eq('id', id)
    .single();

  // Nếu chưa có thì tạo mới
  if (error && error.code === 'PGRST116') {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ id, username, first_name, coin: 0, energy: 500 })
      .select('coin, energy')
      .single();

    return res.json(newUser);
  }

  if (error) {
    console.error('Lỗi Supabase:', error);
    return res.status(500).json({ coin: 0, energy: 0 });
  }

  res.json(data);
});

module.exports = router;
