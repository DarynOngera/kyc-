const crypto = require('crypto');

async function bankCreditIpn(req, res) {
    try {
        const payload = req.body;

        const raw = JSON.stringify(payload ?? {});
        const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');

        console.log('Bank CREDIT IPN received:', {
            hash: payloadHash,
            receivedAt: new Date().toISOString()
        });
        console.log('Bank CREDIT IPN payload:', raw);

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Bank CREDIT IPN handler error:', error);
        return res.status(200).json({ received: true });
    }
}

module.exports = bankCreditIpn;
