require('../test/helpers/test-jwt').applyTestAuthEnv();
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1';
