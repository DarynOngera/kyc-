function normalizeKenyanPhone(input) {
    if (input === null || input === undefined) return null;
    const digits = String(input).replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('254') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.length === 9) return `254${digits}`;
    return digits;
}

module.exports = { normalizeKenyanPhone };
