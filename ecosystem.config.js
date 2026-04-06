module.exports = {
  apps: [
    {
      name: "neron-client",
      script: "npm",
      args: "start",
      cwd: "./",
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PROD: 3000,
      },
      out_file: "./logs/neron-out.log",
      error_file: "./logs/neron-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
