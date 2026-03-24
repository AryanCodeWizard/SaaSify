<!-- # 🚀 SaaSify Hosting Platform

## Domain + Hosting + AWS Infrastructure Lifecycle Documentation

---

# 🧠 SYSTEM ARCHITECTURE OVERVIEW

Your platform consists of **3 independent lifecycles**:

| Layer                    | Controlled By |
| ------------------------ | ------------- |
| Domain Lifecycle         | Registrar     |
| Service Lifecycle        | Billing       |
| Infrastructure Lifecycle | AWS           |

---

# 🚨 GOLDEN RULE

AWS Infrastructure must ALWAYS follow:

```
Service.status
```

Infra must NEVER:

* activate itself
* suspend itself
* renew itself
* terminate itself

---

# 🟣 CORE MODELS & RESPONSIBILITIES

---

## 1. Client

Represents customer account.

❌ MUST NOT contain:

```
walletBalance
```

Use Transaction Ledger instead.

---

## 2. Transaction

Acts as:

```
Wallet Ledger
```

Balance must be calculated as:

```
SUM(all debit + credit transactions)
```

Never store wallet balance directly.

---

## 3. Domain

Represents:

```
Registrar lifecycle
```

Contains:

* expiryDate
* registrarDomainId
* transferStatus
* autoRenew
* nameservers

---

## 4. Service

Represents:

```
Hosting Subscription
```

Single Source of Truth for:

```
status
billingCycle
nextDueDate
autoRenew
suspendedAt
terminatedAt
domainId
```

Service MUST NOT contain:

```
ec2InstanceId
bucketName
certificateArn
cloudfrontId
```

---

## 5. Infrastructure

Represents:

```
AWS resources provisioned for a Service
```

Must contain:

```
serviceId
ec2InstanceId
rdsInstanceId
elasticIp
s3Bucket
cloudfrontDistributionId
certificateArn
securityGroupId
route53RecordId
provisioningLogs
```

Infra MUST NOT contain:

```
billing
autoRenew
status
plan
termination
```

Infra lifecycle is controlled ONLY via Service.

---

## 6. Server

Provisioning Target Only.

❌ MUST NOT store:

```
accessKeyId
secretAccessKey
```

Use:

```
roleArn
```

with STS AssumeRole.

---

# 🔵 LIFECYCLE FLOW

---

## Service Activated

```
Service.status = ACTIVE
→ enqueue provisionInfra(serviceId)
→ infraProvision.worker.js
→ create AWS resources
→ update Infrastructure model
```

---

## Invoice Unpaid

```
CRON
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
→ suspendInfra.worker.js
→ stop EC2
→ disable CloudFront
→ detach EIP
```

---

## Invoice Unpaid 30+ Days

```
CRON
→ Service.status = TERMINATED
→ enqueue destroyInfra(serviceId)
→ destroyInfra.worker.js
→ delete all AWS infra
```

---

## Domain Expired

```
Domain.status = EXPIRED
→ find Service using domainId
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
```

---

## Domain Transfer Failed

```
Domain.status = transfer_failed
→ find Service using domainId
→ Service.status = SUSPENDED
→ enqueue suspendInfra(serviceId)
```

---

## Service Terminated

```
Service.status = TERMINATED
→ enqueue destroyInfra(serviceId)
```

---

# 🟡 REQUIRED CRON BEHAVIOUR

CRON must ONLY:

```
Find
Decide
Enqueue
```

CRON must NEVER:

* stop EC2
* delete S3
* disable CloudFront
* terminate RDS
* modify AWS infra

---

# 🟣 REQUIRED WORKERS

---

## infraProvision.worker.js

Triggered when:

```
Service.status = ACTIVE
```

Must:

```
Create EC2
Create RDS
Allocate EIP
Create S3 Bucket
Request SSL (ACM)
Create CloudFront
Create Route53 records
```

---

## suspendInfra.worker.js

Triggered when:

```
Service.status = SUSPENDED
```

Must:

```
Stop EC2
Disable CloudFront
Detach EIP
Block ALB
```

---

## destroyInfra.worker.js

Triggered when:

```
Service.status = TERMINATED
```

Must:

```
Delete EC2
Release EIP
Delete RDS
Delete CloudFront
Delete ACM
Delete S3
Delete Route53
Delete Infrastructure record
```

---

## renewService.worker.js

Triggered by:

```
autoRenew.cron.js
```

Must:

```
Generate Invoice
Attempt Wallet Deduction
Update nextDueDate
```

---

## domainExpiryCascade.worker.js

Triggered when:

```
Domain.status = EXPIRED
```

Must:

```
Suspend Service
enqueue suspendInfra(serviceId)
```

---

# 🔴 REQUIRED QUEUE

Create:

```
infra.queue.js
```

Jobs:

```
provision-infra
suspend-infra
destroy-infra
```

---

# 🧠 FINAL FLOW

---

### Invoice unpaid

```
CRON
→ Service.status = SUSPENDED
→ enqueue suspendInfra
```

---

### Domain expired

```
Domain EXPIRED
→ Suspend Service
→ enqueue suspendInfra
```

---

### Service terminated

```
Service TERMINATED
→ enqueue destroyInfra
```

---

### Service activated

```
Service ACTIVE
→ enqueue provisionInfra
```

---

# 🚀 FINAL PRODUCTION RULE

AWS Infrastructure must NEVER remain active when:

```
Service.status = SUSPENDED or TERMINATED
```

Infra must always be a slave of:

```
Service.status
```

---

END OF DOCUMENTATION








 -->



# SaaSify Codebase Audit — Architecture Rule Violations

This audit reviews your codebase against the rules in [COPILOT_FIX_GUIDELINES.md](docs/COPILOT_FIX_GUIDELINES.md) and highlights all detected violations, risks, and missing elements.

---

## 1. **Model Layer Problems**

### ❌ HostingService.js / HostingService 2.js
- **Naming:** Should be renamed to `Infrastructure.js`.
- **Fields:** Contains business logic fields (`billingCycle`, `domainName`, usage, etc.) and AWS resource fields in one model.  
  **Rule:** Only AWS infra identifiers and provisioning logs are allowed in Infrastructure.  
  **Action:**  
  - Move all business/billing/status/domain fields to `Service.js`.
  - Keep only AWS resource identifiers (EC2, RDS, S3, CloudFront, ACM, etc.) and logs.

### ❌ Service.js
- **Fields:** Must be the **only** source of truth for lifecycle (`status`, `billingCycle`, `nextDueDate`, `autoRenew`, etc.).
- **References:** Must reference `domainId` (ObjectId to Domain), not `domainName`.
- **Rule:** Must NOT contain AWS infra fields (e.g., `bucketName`, `cloudfrontId`, `certificateArn`).
- **Action:**  
  - Remove any AWS infra fields from Service.
  - Ensure all infra is referenced via Infrastructure model.

### ❌ Client.js
- **Fields:** If `walletBalance` exists, this violates the wallet rule.
- **Action:**  
  - Remove `walletBalance`.
  - Use a transaction-based ledger (`Transaction.js`) for wallet operations.

### ❌ General Reference Issues
- **Problem:** Use of string fields for relationships (e.g., `domainName`) instead of ObjectId references.
- **Action:**  
  - Refactor all such fields to use ObjectId.

### ❌ AWS Credentials
-

---

## 2. **Worker & Cron Layer Problems**

### ❌ Missing Required Workers
**Required (per docs):**
- `infraProvision.worker.js` m,
- `suspendInfra.worker.js`
- `destroyInfra.worker.js`
- `renewService.worker.js`
- `domainExpiryCascade.worker.js`

**Found:**
- Only domain-related and notification workers exist.
- No workers for infra provision, suspension, or destruction.

**Action:**  
- Implement missing infra workers.
- Workers must act on infra only when triggered by `Service.status` changes.

### ❌ Cron/Worker Separation
- **Problem:** Crons may be doing both decision and action.
- **Rule:** Crons must only **find/decide/enqueue**; workers must **act**.
- **Action:**  
  - Refactor crons to only enqueue jobs for workers.

### ❌ No Infra Queue
- **Rule:** Must have a queue (`infra.queue.js`) for infra jobs (`provision-infra`, `suspend-infra`, `destroy-infra`).
- **Action:**  
  - Implement a queue for infra jobs.

---

## 3. **Lifecycle & Automation Flow Problems**

### ❌ AWS Infra Not Fully Slave to Service.status
- **Problem:** Infra may be provisioned/suspended/terminated outside of `Service.status` changes.
- **Rule:** All infra actions must be triggered by `Service.status` only.

### ❌ Orphaned Resources Risk
- **Problem:** No guarantee that infra is destroyed when `Service.status = TERMINATED`.
- **Action:**  
  - Ensure destroyInfra worker is always triggered on termination.

### ❌ Domain Expiry Cascade
- **Problem:** No explicit `domainExpiryCascade.worker.js` to suspend services on domain expiry.
- **Action:**  
  - Implement this worker.

---

## 4. **Other Issues**

### ❌ Duplicate/Legacy Files
- Both `HostingService.js` and `HostingService 2.js` exist.
- Both `static-hosting.routes.js` and `static-hosting.routes 2.js` exist.
- **Action:**  
  - Remove duplicates and keep only the correct, rule-compliant files.

---

## 5. **Frontend/UX**
- **No direct violations found** in frontend, but ensure all service/infrastructure status displays are based on `Service.status`.

---

## 6. **Documentation**
- **Docs are present and clear.**  
  - But codebase does not fully implement the documented architecture.

---

# 📋 Summary Table

| Area                | Problem/Violation                                                                 |
|---------------------|-----------------------------------------------------------------------------------|
| Models              | HostingService not renamed, forbidden fields, wrong references, walletBalance     |
| Workers             | Missing infra workers, missing queue, crons doing actions                        |
| Lifecycle           | Infra not always slave to Service.status, risk of orphaned infra                  |
| References          | Use of string fields instead of ObjectId                                          |
| AWS Credentials     | Risk if access keys are stored                                                    |
| Duplicates          | Duplicate models/routes                                                           |

---

# ✅ Next Steps

1. **Refactor models**: Split business and infra, rename, fix references.
2. **Implement missing workers**: infraProvision, suspendInfra, destroyInfra, renewService, domainExpiryCascade.
3. **Add infra queue**: All infra actions must go through a queue.
4. **Refactor crons**: Only find/enqueue, never act directly.
5. **Remove duplicates**: Clean up legacy/duplicate files.
6. **Audit for credentials**: Ensure no AWS keys are stored in DB.

---

**Your codebase needs significant refactoring to fully comply with the SaaS hosting architecture rules.**