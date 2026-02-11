/**
 * PM2 Ecosystem Configuration
 * For production deployment with clustering
 * 
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 *   
 * Commands:
 *   pm2 logs           - View logs
 *   pm2 monit          - Monitor processes
 *   pm2 reload all     - Zero-downtime reload
 *   pm2 delete all     - Stop all processes
 */

module.exports = {
  apps: [
    {
      name: 'mani-me-api',
      script: './index.js',
      
      // ========================================
      // CLUSTERING (use all CPU cores)
      // ========================================
      instances: 'max',        // Use all available CPU cores
      exec_mode: 'cluster',    // Enable cluster mode
      
      // ========================================
      // MEMORY & RESTART POLICIES
      // ========================================
      max_memory_restart: '500M',    // Restart if memory exceeds 500MB
      min_uptime: '10s',             // Min uptime before considering healthy
      max_restarts: 10,              // Max restarts before stopping
      restart_delay: 4000,           // Delay between restarts (ms)
      
      // ========================================
      // MONITORING
      // ========================================
      watch: false,                  // Disable file watching in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // ========================================
      // LOGGING
      // ========================================
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,              // Merge logs from all instances
      
      // ========================================
      // ENVIRONMENT VARIABLES
      // ========================================
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      
      // ========================================
      // GRACEFUL SHUTDOWN
      // ========================================
      kill_timeout: 5000,            // Time to wait for graceful shutdown
      listen_timeout: 8000,          // Time to wait for app to listen
      shutdown_with_message: true,   // Send SIGINT message before SIGKILL
      
      // ========================================
      // ADVANCED OPTIONS
      // ========================================
      node_args: [
        '--max-old-space-size=512',  // Limit V8 heap size
      ],
      
      // Auto-restart at specific time (optional - memory cleanup)
      // cron_restart: '0 3 * * *',  // Restart at 3 AM daily
    }
  ],
  
  // ========================================
  // DEPLOYMENT CONFIGURATION (Optional)
  // ========================================
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/mani-me-backend.git',
      path: '/var/www/mani-me-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    }
  }
};
