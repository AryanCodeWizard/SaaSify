# 🚀 SaaSify Complete Lifecycle Documentation

## Domain Lifecycle + Hosting Lifecycle (Service + AWS Infra)

---

# 🧠 SYSTEM HAS 2 MAIN LIFECYCLES

---

## 🟣 1. DOMAIN LIFECYCLE

Controlled by:

```
Registrar (GoDaddy)
```

Represents:

```
Ownership + DNS Delegation
```

---

## 🟢 2. HOSTING LIFECYCLE

Controlled by:

```
Billing + Service Subscription
```

Represents:

```
Compute + Storage + Network (AWS Infra)
```

---

# 🚨 GOLDEN RULE

Hosting Infra MUST always follow:

```
Service.status
```

Service MUST follow:

```
Billing + Domain validity
```

---

# 🟣 DOMAIN LIFECYCLE STATES

---

## Domain Purchase

```
User buys domain
→ domainRegistration.worker.js
→ GoDaddy register
→ Domain.status = ACTIVE
```

---

## Domain Transfer

```
User initiates transfer
→ Domain.status = transfer_initiated
→ transferStatus.worker checks status
```

---

### Transfer Completed

```
Domain.status = ACTIVE
expiryDate updated
```

---

### Transfer Failed ❗

```
Domain.status = transfer_failed
→ find Service using domainId
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
```

Infra MUST stop.

---

## Domain Expiring

```
expiryDate - 30/7/1 days
→ send reminders
```

---

## Domain Expired ❗

```
Domain.status = EXPIRED
→ find Service using domainId
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
```

---

## Domain Renewed

```
domainRenewal.worker.js
→ update expiryDate
```

If hosting suspended earlier:

```
→ Service may be reactivated
→ enqueue provisionInfra(serviceId)
```

---

# 🟢 HOSTING LIFECYCLE (SERVICE)

---

## Service Created

```
User buys hosting
→ Service.status = PENDING
```

---

## Service Activated

```
Invoice paid
→ Service.status = ACTIVE
→ enqueue provisionInfra(serviceId)
```

---

# 🟡 infraProvision.worker.js

Must:

```
Create EC2
Create RDS
Allocate EIP
Create S3
Request SSL (ACM)
Create CloudFront
Create Route53 DNS
```

Save in:

```
Infrastructure model
```

---

## Service Running

Hosting LIVE:

```
EC2
CloudFront
S3
RDS
SSL
DNS
```

---

## Invoice Overdue (>7 days)

CRON:

```
serviceSuspension.cron.js
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
```

---

# 🔴 suspendInfra.worker.js

Must:

```
Stop EC2
Disable CloudFront
Detach Elastic IP
Block ALB
```

Hosting becomes inactive.

---

## Invoice Overdue (>30 days)

CRON:

```
serviceTermination.cron.js
→ Service.status = TERMINATED
→ enqueue destroyInfra(serviceId)
```

---

# 🔴 destroyInfra.worker.js

Must:

```
Delete EC2
Release EIP
Delete RDS
Delete CloudFront
Delete S3
Delete ACM SSL
Delete Route53 records
Delete Infrastructure record
```

---

# 🟣 DOMAIN → HOSTING CASCADE

---

## Domain Expired

```
Domain EXPIRED
→ suspend hosting
→ suspendInfra
```

---

## Domain Transfer Failed

```
transfer_failed
→ suspend hosting
→ suspendInfra
```

---

## Domain Renewed After Suspension

```
Domain ACTIVE
→ Reactivate Service
→ provisionInfra
```

---

# 🔵 BILLING → HOSTING CASCADE

---

## Invoice unpaid

```
Service SUSPENDED
→ suspendInfra
```

---

## Invoice unpaid 30 days

```
Service TERMINATED
→ destroyInfra
```

---

# 🟡 REQUIRED CRON RESPONSIBILITY

CRON must ONLY:

```
Find affected Service / Domain
Update Service.status
Enqueue Infra Job
```

CRON must NEVER:

* Stop EC2
* Delete RDS
* Disable CloudFront
* Delete S3
* Modify AWS Infra

---

# 🟣 REQUIRED INFRA QUEUE

Jobs:

```
provision-infra
suspend-infra
destroy-infra
```

---

# 🧠 FINAL EVENT FLOWS

---

## Service Activated

```
Service ACTIVE
→ provisionInfra
```

---

## Domain Expired

```
Domain EXPIRED
→ Service SUSPENDED
→ suspendInfra
```

---

## Transfer Failed

```
Domain transfer_failed
→ Service SUSPENDED
→ suspendInfra
```

---

## Invoice Overdue

```
Service SUSPENDED
→ suspendInfra
```

---

## Invoice Overdue 30 Days

```
Service TERMINATED
→ destroyInfra
```

---

# 🚀 FINAL PRODUCTION SAFETY RULE

AWS Infra MUST NEVER remain active when:

```
Service.status = SUSPENDED
OR
Service.status = TERMINATED
```

Infra always follows:

```
Service.status
```

---

END OF LIFECYCLE DOCUMENTATION
