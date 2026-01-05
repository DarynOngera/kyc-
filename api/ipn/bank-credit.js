const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function bankCreditIpn(req, res) {
    try {
        const payload = req.body;

        const raw = JSON.stringify(payload ?? {});
        const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');

        try {
            const logDir = path.join(process.cwd(), 'logs');
            fs.mkdirSync(logDir, { recursive: true });
            const logLine = `${new Date().toISOString()}\t${payloadHash}\t${raw}\n`;
            fs.appendFileSync(path.join(logDir, 'bank-credit-ipn.log'), logLine, { encoding: 'utf8' });
        } catch (logError) {
            console.error('Bank CREDIT IPN file log error:', logError);
        }

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
