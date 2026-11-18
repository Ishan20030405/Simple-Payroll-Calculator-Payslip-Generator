module.exports = function corsOptions(env = process.env) {
    if (env.VERCEL && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
        throw new Error('Set JWT_SECRET to a random secret of at least 32 characters');
    }
    if (env.VERCEL && !env.FRONTEND_URL) throw new Error('Set FRONTEND_URL to the deployed website origin');
    const urls = [env.FRONTEND_URL, ...(env.CORS_ORIGINS || '').split(',')].filter(Boolean);
    const allowed = new Set(urls.map(value => {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
            throw new Error('FRONTEND_URL and CORS_ORIGINS must contain HTTP website origins only');
        }
        return url.origin;
    }));
    // Preserve unconfigured local development; cloud requires an explicit origin.
    if (!allowed.size) return {};
    return { origin(origin, callback) {
        if (!origin || allowed.has(origin)) return callback(null, true);
        callback(Object.assign(new Error('This website origin is not allowed'), { status: 403 }));
    } };
};
