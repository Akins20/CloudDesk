# CloudDesk Backend SSL Setup Guide

This guide will help you set up HTTPS for your CloudDesk backend API.

## Problem

The frontend is served over HTTPS (Vercel), but the backend uses HTTP. Browsers block mixed content (HTTPS → HTTP requests) for security.

## Solution

Set up Nginx as a reverse proxy with SSL certificates on your EC2 instance.

---

## Option 1: Let's Encrypt (Recommended for Production)

Use this if you have a domain name pointed to your server.

### Prerequisites

1. A domain name (e.g., `api.clouddesk.com`)
2. DNS A record pointing to your EC2 instance IP
3. AWS Security Group allowing ports 80 and 443

### Steps

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Copy the setup script to your server:**
   ```bash
   # On your local machine
   scp -i your-key.pem backend/scripts/setup-nginx-ssl.sh ubuntu@your-ec2-ip:~/
   ```

3. **Run the setup script:**
   ```bash
   # On the EC2 instance
   chmod +x setup-nginx-ssl.sh
   sudo ./setup-nginx-ssl.sh
   ```

4. **Follow the prompts:**
   - Enter your domain name (e.g., `api.clouddesk.com`)
   - Enter your email for Let's Encrypt notifications
   - Confirm the setup

5. **Verify the backend is running:**
   ```bash
   pm2 status
   # If not running, start it:
   cd ~/clouddesk-backend
   pm2 start ecosystem.config.js
   ```

6. **Test the API:**
   ```bash
   curl https://api.clouddesk.com/api/health
   ```

7. **Update frontend environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://api.clouddesk.com
   ```

8. **Redeploy frontend on Vercel**

---

## Option 2: Self-Signed Certificate (Quick Testing)

Use this for quick testing without a domain name. **Not recommended for production.**

### Prerequisites

1. AWS Security Group allowing ports 80 and 443

### Steps

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Copy the setup script to your server:**
   ```bash
   # On your local machine
   scp -i your-key.pem backend/scripts/setup-nginx-selfsigned.sh ubuntu@your-ec2-ip:~/
   ```

3. **Run the setup script:**
   ```bash
   # On the EC2 instance
   chmod +x setup-nginx-selfsigned.sh
   sudo ./setup-nginx-selfsigned.sh
   ```

4. **Verify the backend is running:**
   ```bash
   pm2 status
   # If not running, start it:
   cd ~/clouddesk-backend
   pm2 start ecosystem.config.js
   ```

5. **Test the API (note the -k flag to accept self-signed cert):**
   ```bash
   curl -k https://YOUR_EC2_IP/api/health
   ```

6. **Update frontend environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://18.209.65.32
   ```

7. **Redeploy frontend on Vercel**

8. **Important:** Browsers will show a security warning. You'll need to:
   - Click "Advanced"
   - Click "Proceed to site (unsafe)"
   - This is only for testing!

---

## AWS Security Group Configuration

Ensure your EC2 security group allows these ports:

| Type  | Protocol | Port Range | Source      | Description          |
|-------|----------|------------|-------------|----------------------|
| HTTP  | TCP      | 80         | 0.0.0.0/0   | HTTP (redirects)     |
| HTTPS | TCP      | 443        | 0.0.0.0/0   | HTTPS API            |
| SSH   | TCP      | 22         | Your IP     | SSH access           |

---

## Troubleshooting

### Check Nginx status
```bash
sudo systemctl status nginx
```

### View Nginx logs
```bash
# Error logs
sudo tail -f /var/log/nginx/clouddesk_error.log

# Access logs
sudo tail -f /var/log/nginx/clouddesk_access.log
```

### Test Nginx configuration
```bash
sudo nginx -t
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check if backend is running
```bash
pm2 status
pm2 logs clouddesk-backend
```

### Test SSL certificate (Let's Encrypt only)
```bash
sudo certbot certificates
```

### Manually renew certificate (Let's Encrypt only)
```bash
sudo certbot renew
```

### Test certificate auto-renewal (Let's Encrypt only)
```bash
sudo certbot renew --dry-run
```

---

## Environment Variables

### Backend (.env)
No changes needed. Backend runs on `localhost:3000` and Nginx proxies to it.

### Frontend (.env.local or Vercel Environment Variables)
```bash
# For Let's Encrypt
NEXT_PUBLIC_API_URL=https://api.clouddesk.com

# For self-signed (testing only)
NEXT_PUBLIC_API_URL=https://18.209.65.32
```

After updating, redeploy on Vercel.

---

## Certificate Auto-Renewal (Let's Encrypt only)

Certificates are valid for 90 days and auto-renew via systemd timer.

Check renewal timer status:
```bash
sudo systemctl status certbot.timer
```

The timer runs twice daily and renews certificates within 30 days of expiry.

---

## Security Notes

1. **Let's Encrypt** provides trusted certificates that work in all browsers
2. **Self-signed certificates** should only be used for testing
3. Always use HTTPS in production
4. Keep your SSL certificates secure
5. Monitor certificate expiry dates

---

## Need Help?

If you encounter issues:

1. Check Nginx error logs
2. Verify DNS is pointing to the correct IP
3. Ensure ports 80 and 443 are open in AWS Security Group
4. Verify backend is running on localhost:3000
5. Test with curl before testing in browser
