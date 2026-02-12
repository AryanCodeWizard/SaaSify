# 🚀 Quick Start Guide - AWS Route53 DNS Management

## ⚡ 5-Minute Setup

### **Step 1: AWS Account Setup**

1. **Create AWS Account** (if you don't have one)
   - Go to: https://aws.amazon.com/
   - Click "Create an AWS Account"
   - Follow signup process

2. **Create IAM User for SaaSify**
   ```
   1. Login to AWS Console
   2. Go to: IAM → Users → Create user
   3. Username: saasify-route53
   4. Select: "Programmatic access"
   5. Permissions: Attach existing policy → Create policy
   6. Use this JSON:
   ```

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "route53:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

   ```
   7. Name policy: SaaSifyRoute53FullAccess
   8. Create user
   9. Copy Access Key ID and Secret Access Key
   ```

### **Step 2: Add AWS Credentials to Backend**

Edit `backend/.env`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA... (your access key)
AWS_SECRET_ACCESS_KEY=wJalrXUtn... (your secret key)
AWS_REGION=us-east-1
```

### **Step 3: Restart Backend**

```bash
cd backend
npm run dev
```

Look for:
```
✓ AWS services connected    ← This means it's working!
```

### **Step 4: Test with Postman**

1. **Get Your Domain ID**
   - Login to your platform
   - Go to domains page
   - Copy a domain's ID from browser network tab or database

2. **Create Hosted Zone**
   ```
   POST http://localhost:4000/api/hosting/dns/zones
   Headers:
     Authorization: Bearer YOUR_JWT_TOKEN
   Body:
     {
       "domainId": "YOUR_DOMAIN_ID"
     }
   ```

3. **Success! You'll Get:**
   ```json
   {
     "hostedZoneId": "Z2ABCD...",
     "nameServers": [
       "ns-1234.awsdns-12.org",
       "ns-5678.awsdns-34.com",
       ...
     ]
   }
   ```

---

## 🎯 Common Use Cases

### **Use Case 1: Point Domain to Server**

```bash
# Create A record
POST /api/hosting/dns/records/DOMAIN_ID

{
  "name": "example.com",
  "type": "A",
  "ttl": 300,
  "values": ["54.210.23.45"]
}
```

### **Use Case 2: Add WWW Subdomain**

```bash
# Create CNAME record
POST /api/hosting/dns/records/DOMAIN_ID

{
  "name": "www.example.com",
  "type": "CNAME",
  "ttl": 300,
  "values": ["example.com"]
}
```

### **Use Case 3: Setup Email (Google Workspace)**

```bash
# Add MX records
POST /api/hosting/dns/records/DOMAIN_ID

{
  "name": "example.com",
  "type": "MX",
  "ttl": 3600,
  "values": [
    "1 aspmx.l.google.com",
    "5 alt1.aspmx.l.google.com",
    "5 alt2.aspmx.l.google.com"
  ]
}
```

### **Use Case 4: Quick Setup (Default Records)**

```bash
# Creates both root and www A records
POST /api/hosting/dns/default/DOMAIN_ID

{
  "targetIp": "54.210.23.45"
}
```

---

## 💰 Cost Calculator

### **AWS Costs:**
- Hosted Zone: **$0.50/month**
- DNS Queries: **$0.40 per 1M queries**

### **Example Scenarios:**

**100 Domains:**
- AWS Cost: $50/month
- Sell at: $2/domain/month
- Revenue: $200/month
- **Profit: $150/month**

**1,000 Domains:**
- AWS Cost: $500/month
- Sell at: $2/domain/month
- Revenue: $2,000/month
- **Profit: $1,500/month**

**10,000 Domains:**
- AWS Cost: $5,000/month
- Sell at: $2/domain/month
- Revenue: $20,000/month
- **Profit: $15,000/month**

---

## 🔍 How to Test Everything

### **1. Check Server Logs**
```bash
cd backend
tail -f logs/combined.log
```

### **2. Test API Endpoints**

Import this Postman collection: `backend/SaaSify_API_Collection.postman_collection.json`

Or use cURL:

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}' | jq -r '.data.accessToken')

# 2. Get your domains
curl -s http://localhost:4000/api/domains \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Create hosted zone (use domain ID from step 2)
curl -s -X POST http://localhost:4000/api/hosting/dns/zones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"domainId":"YOUR_DOMAIN_ID"}' | jq

# 4. List DNS records
curl -s http://localhost:4000/api/hosting/dns/records/YOUR_DOMAIN_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Check DNS propagation
curl -s http://localhost:4000/api/hosting/dns/check/YOUR_DOMAIN_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ⚠️ Important Notes

### **Nameserver Update Required**

After creating a hosted zone:

1. **Copy AWS Nameservers** from API response
2. **Update at GoDaddy** (or your registrar)
   - Login to GoDaddy
   - Go to domain settings
   - Find "Nameservers"
   - Select "Custom"
   - Add all 4 AWS nameservers
3. **Wait 5-10 minutes** for propagation

### **DNS Propagation Time**

- **Minimum:** 5 minutes
- **Typical:** 30 minutes
- **Maximum:** 48 hours (rare)
- **Use propagation checker:** `/api/hosting/dns/check/:domainId`

### **Testing in Development**

You can test without a real domain!
- Use any domain in your database
- Create hosted zone
- Create DNS records
- Check them in AWS console

---

## 🎓 Next Steps

### **Day 3-4: S3 Static Hosting**

Once Route53 is working, we'll add:
- S3 bucket creation
- Static website hosting
- File uploads
- CloudFront CDN
- SSL certificates
- Link everything together

### **Day 5-7: EC2 Dynamic Hosting**

After S3 works:
- EC2 instance provisioning
- Docker containers
- Node.js/PHP/Python apps
- MySQL databases
- Auto-scaling

---

## 🐛 Troubleshooting

### **"AWS services not configured"**
- Check `.env` file has AWS credentials
- Restart backend: `npm run dev`

### **"Invalid credentials"**
- Verify AWS Access Key and Secret Key
- Check IAM user has Route53 permissions
- Try generating new credentials

### **"Hosted zone already exists"**
- Each domain can only have one hosted zone
- Delete existing zone first or use existing one

### **"Domain not found"**
- Verify domain exists in database
- Check domain belongs to logged-in user
- Use correct domain ID

### **DNS not resolving**
- Check nameservers updated at registrar
- Wait 10-30 minutes for propagation
- Use propagation checker API

---

## 📞 Support

Check the complete documentation:
- `PHASE5_DAY1-2_AWS_ROUTE53.md`

View logs:
```bash
tail -f backend/logs/combined.log
```

---

**🎉 You're all set! Start managing DNS via your API!**
