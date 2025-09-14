module.exports = {
  apps: [
    {
      name: 'fps-frontend',
      script: 'npm run start:frontend:prod',
      cwd: './react',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5642
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5642
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      merge_logs: true,
      time: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 1000,
      autorestart: true,
      ignore_watch: [
        'node_modules',
        'dist',
        'logs'
      ]
    },
    {
      name: 'fps-backend',
      script: './server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5642,
        CORS_ORIGINS: 'https://rfpsgame.boondit.site,http://rfpsgame.boondit.site,http://localhost:5642,https://localhost:5642'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5642,
        CORS_ORIGINS: 'http://localhost:5642,https://localhost:5642,http://127.0.0.1:5642,https://127.0.0.1:5642'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log',
      merge_logs: true,
      time: true,
      watch: ['./server'],
      max_memory_restart: '1G',
      restart_delay: 1000,
      autorestart: true,
      ignore_watch: [
        'node_modules',
        'logs'
      ]
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:AidanTheBandit/FPS-WSS-R1.git',
      path: '/var/www/fps-game',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
