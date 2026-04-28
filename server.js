const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GUERRILLA_BASE = 'https://api.guerrillamail.com/ajax.php';

async function guerrilla(params) {
  const res = await axios.get(GUERRILLA_BASE, { params });
  return res.data;
}

app.get('/api/email', async (req, res) => {
  try {
    const data = await guerrilla({ f: 'get_email_address', lang: 'en' });
    res.json({ email: data.email_addr, sid_token: data.sid_token, alias: data.alias });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get email', details: err.message });
  }
});

app.get('/api/inbox', async (req, res) => {
  try {
    const { sid_token, seq = 0 } = req.query;
    if (!sid_token) return res.status(400).json({ error: 'sid_token required' });
    const data = await guerrilla({ f: 'get_email_list', offset: 0, sid_token, seq });
    res.json({ emails: data.list || [], count: data.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inbox', details: err.message });
  }
});

app.get('/api/email/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sid_token } = req.query;
    if (!sid_token) return res.status(400).json({ error: 'sid_token required' });
    const data = await guerrilla({ f: 'fetch_email', email_id: id, sid_token });
    res.json({ from: data.mail_from, subject: data.mail_subject, body: data.mail_body, date: data.mail_date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email', details: err.message });
  }
});

app.delete('/api/email', async (req, res) => {
  try {
    const { sid_token } = req.query;
    await guerrilla({ f: 'forget_me', sid_token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TempMail backend running on http://localhost:${PORT}`));
