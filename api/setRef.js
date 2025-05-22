const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/setRef', async (req, res) => {
  const { id, ref_by } = req.body;

  if (!id || !ref_by || id === ref_by) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    // Kiểm tra nếu user đã có ref_by
    const { data: existing, error: getErr } = await supabase
      .from('users')
      .select('ref_by')
      .eq('id', id)
      .single();

    if (getErr) throw getErr;

    if (existing?.ref_by) {
      return res.json({ success: false, message: 'Bạn đã nhập mã mời rồi.' });
    }

    // Cập nhật ref_by
    const { error: updateErr } = await supabase
      .from('users')
      .update({ ref_by })
      .eq('id', id);

    if (updateErr) throw updateErr;

    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi Supabase:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
