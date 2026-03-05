module.exports = {
    apps: [
        {
            name: 'hidoctor-backend',
            cwd: 'd:/Harman Data-2025/Harman Data/DOCTOR/archive/backend',
            interpreter: 'd:/Harman Data-2025/Harman Data/DOCTOR/archive/backend/venv/Scripts/python.exe',
            script: 'start_server.py',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 3000,
            env: {
                MONGO_URL: 'mongodb+srv://zafukaka_db_user:ykxIa4hrUOBBLfKs@hidoctor.kqi4fdu.mongodb.net/?appName=HiDoctor',
                DB_NAME: 'hidoctor_db',
                CORS_ORIGINS: '*',
                JWT_SECRET: 'hidoctor-platform-secret-key-2024-secure',
                STRIPE_API_KEY: 'sk_test_placeholder',
                RAZORPAY_KEY_ID: 'rzp_live_c7gTlgrLWpkoC2',
                RAZORPAY_KEY_SECRET: 'ljYHTqDKXTEv9XxCri7TYMoS',
                OPENROUTER_API_KEY: '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'
            }
        },
        {
            name: 'hidoctor-frontend',
            cwd: 'd:/Harman Data-2025/Harman Data/DOCTOR/archive/frontend',
            script: 'node_modules/react-scripts/scripts/start.js',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 3000,
            env: {
                PORT: 3000,
                REACT_APP_BACKEND_URL: 'http://localhost:8001',
                BROWSER: 'none'
            }
        },
        {
            name: 'hidoctor-mobile',
            cwd: 'd:/Harman Data-2025/Harman Data/DOCTOR/archive/mobile',
            script: 'node_modules/expo/bin/cli.js',
            args: 'start --tunnel',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            env: {
                EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0'
            }
        }
    ]
};
