// routes/proxyAtw.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * GET /api/proxy/atw/:uid
 * Forwards the request to the device API:
 *   http://192.168.0.207:11/api/v2/atw/stream/fetch?id=<uid>
 */
router.get('/atw/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    if (!uid) return res.status(400).json({ message: 'Missing UID' });

    const deviceUrl = `http://172.16.2.7:3999/api/v2/atw/stream/fetch?id=${encodeURIComponent(uid)}`;

    // If device requires headers/Auth, add them here
    const resp = await axios.get(deviceUrl, { timeout: 10000 });

    // Forward the device response exactly
    return res.json(resp.data);
  } catch (err) {
    console.error('Proxy error fetching device API:', err?.message || err);

    // If device responded with non-2xx, forward that status + info
    if (err.response) {
      return res.status(err.response.status).json({
        message: err.response.data?.message || 'Device API error',
        details: err.response.data ?? err.response.statusText,
      });
    }

    // No response from device (network / timeout)
    if (err.request) {
      return res.status(502).json({ message: 'No response from device (network or timeout)' });
    }

    return res.status(500).json({ message: 'Proxy internal error', error: err.message });
  }
});

module.exports = router;
