function getPathBasedOnEnv(env) {
    if (NODE_ENV == envs) {
        return './config/default.js';
    }
    return './config/development.js';
}

export const path = getPathBasedOnEnv(process.env.NODE_ENV);
