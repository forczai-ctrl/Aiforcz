"""
Mock data seeder for AIForcz ITGC Monitoring Platform.
Generates realistic ITGC scenarios including:
- IAM users with various compliance postures (POC-specified names)
- CloudTrail events with change management issues
- Configuration changes with violations
- ITGC findings across all control categories
- IAM Groups
- Change Requests from CSV
"""

from datetime import datetime, timedelta
import csv
import os
import random
from typing import List
from .models import IAMUser, IAMGroup, CloudTrailEvent, ConfigChange, ITGCFinding, ChangeRequest
from .database import SessionLocal


def seed_database():
    """Seed the database with realistic ITGC monitoring data"""
    db = SessionLocal()

    try:
        # Check if data already exists
        existing_users = db.query(IAMUser).count()
        if existing_users > 0:
            print("Database already seeded. Skipping...")
            return

        # Seed IAM Groups
        groups = _create_iam_groups()
        for group in groups:
            db.add(group)
        db.flush()

        # Seed IAM Users
        users = _create_iam_users()
        for user in users:
            db.add(user)
        db.flush()

        # Seed CloudTrail Events
        events = _create_cloudtrail_events()
        for event in events:
            db.add(event)
        db.flush()

        # Seed Config Changes
        configs = _create_config_changes()
        for config in configs:
            db.add(config)
        db.flush()

        # Seed Change Requests from CSV
        change_requests = _load_change_requests()
        for cr in change_requests:
            db.add(cr)
        db.flush()

        # Seed ITGC Findings
        findings = _create_itgc_findings()
        for finding in findings:
            db.add(finding)

        db.commit()
        print(f"Database seeded successfully!")
        print(f"  - {len(groups)} IAM Groups")
        print(f"  - {len(users)} IAM Users")
        print(f"  - {len(events)} CloudTrail Events")
        print(f"  - {len(configs)} Config Changes")
        print(f"  - {len(change_requests)} Change Requests")
        print(f"  - {len(findings)} ITGC Findings")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


def _create_iam_groups() -> List[IAMGroup]:
    """Create IAM groups matching POC specification"""
    groups_data = [
        {"name": "Administrators", "desc": "Full administrative access to all AWS resources", "policies": 5, "users": 3},
        {"name": "Finance", "desc": "Access to financial systems and S3 buckets", "policies": 3, "users": 2},
        {"name": "Developers", "desc": "Developer access to dev and test environments", "policies": 4, "users": 3},
        {"name": "ReadOnly", "desc": "Read-only access for auditing and monitoring", "policies": 2, "users": 2},
        {"name": "Auditors", "desc": "Auditor access for compliance review", "policies": 2, "users": 1},
    ]
    return [
        IAMGroup(group_name=g["name"], description=g["desc"], policy_count=g["policies"], user_count=g["users"])
        for g in groups_data
    ]


def _create_iam_users() -> List[IAMUser]:
    """Create realistic IAM users with POC-specified names and various compliance postures"""
    now = datetime.utcnow()

    user_data = [
        # POC-specified users with intentional risks (Step 2)
        {"username": "john.admin", "email": "john.admin@company.com", "role": "admin", "department": "IT",
         "manager": None, "mfa": False, "last_login_days": 45, "created_days": 365, "active": True,
         "privileged": True, "keys": 2, "logins": 150, "profiles": 1, "shared": False},
        {"username": "susan.finance", "email": "susan.finance@company.com", "role": "finance", "department": "Finance",
         "manager": "finance-dir@company.com", "mfa": True, "last_login_days": 5, "created_days": 500, "active": True,
         "privileged": True, "keys": 1, "logins": 250, "profiles": 1, "shared": False},
        {"username": "mike.developer", "email": "mike.dev@company.com", "role": "developer", "department": "Engineering",
         "manager": "dev-mgr@company.com", "mfa": True, "last_login_days": 2, "created_days": 300, "active": True,
         "privileged": False, "keys": 1, "logins": 400, "profiles": 1, "shared": False},
        {"username": "audit.test", "email": "audit.test@company.com", "role": "auditor", "department": "Audit",
         "manager": "audit-dir@company.com", "mfa": False, "last_login_days": 180, "created_days": 600, "active": False,
         "privileged": False, "keys": 0, "logins": 5, "profiles": 1, "shared": False},
        {"username": "service.account", "email": "svc.account@company.com", "role": "service", "department": "DevOps",
         "manager": None, "mfa": False, "last_login_days": 1, "created_days": 900, "active": True,
         "privileged": True, "keys": 4, "logins": 1000, "profiles": 5, "shared": True},

        # Additional test users
        {"username": "admin-sarah", "email": "sarah@company.com", "role": "admin", "department": "IT",
         "manager": "cto@company.com", "mfa": True, "last_login_days": 2, "created_days": 730, "active": True,
         "privileged": True, "keys": 1, "logins": 500, "profiles": 1, "shared": False},
        {"username": "root-account", "email": "aws-root@company.com", "role": "root", "department": "IT",
         "manager": None, "mfa": False, "last_login_days": 7, "created_days": 1095, "active": True,
         "privileged": True, "keys": 2, "logins": 50, "profiles": 1, "shared": False},

        # Inactive users
        {"username": "jane.smith", "email": "jane.smith@company.com", "role": "developer", "department": "Engineering",
         "manager": "dev-mgr@company.com", "mfa": True, "last_login_days": 120, "created_days": 500, "active": True,
         "privileged": False, "keys": 1, "logins": 200, "profiles": 1, "shared": False},
        {"username": "bob.wilson", "email": "bob.wilson@company.com", "role": "qa", "department": "QA",
         "manager": "qa-mgr@company.com", "mfa": True, "last_login_days": 200, "created_days": 600, "active": True,
         "privileged": False, "keys": 0, "logins": 80, "profiles": 1, "shared": False},

        # Dormant admin accounts
        {"username": "legacy-admin", "email": "legacy@company.com", "role": "admin", "department": "IT",
         "manager": None, "mfa": False, "last_login_days": 180, "created_days": 800, "active": True,
         "privileged": True, "keys": 3, "logins": 300, "profiles": 1, "shared": False},
        {"username": "emergency-admin", "email": "emergency@company.com", "role": "admin", "department": "IT",
         "manager": None, "mfa": True, "last_login_days": 95, "created_days": 400, "active": True,
         "privileged": True, "keys": 2, "logins": 10, "profiles": 1, "shared": False},

        # Normal users (compliant)
        {"username": "alice.johnson", "email": "alice@company.com", "role": "developer", "department": "Engineering",
         "manager": "dev-mgr@company.com", "mfa": True, "last_login_days": 1, "created_days": 300, "active": True,
         "privileged": False, "keys": 1, "logins": 400, "profiles": 1, "shared": False},
        {"username": "charlie.brown", "email": "charlie@company.com", "role": "analyst", "department": "Finance",
         "manager": "fin-mgr@company.com", "mfa": True, "last_login_days": 3, "created_days": 200, "active": True,
         "privileged": False, "keys": 0, "logins": 150, "profiles": 1, "shared": False},
    ]

    users = []
    for data in user_data:
        user = IAMUser(
            username=data["username"],
            email=data["email"],
            role=data["role"],
            department=data["department"],
            manager=data["manager"],
            mfa_enabled=data["mfa"],
            last_login=now - timedelta(days=data["last_login_days"]),
            created_date=now - timedelta(days=data["created_days"]),
            is_active=data["active"],
            is_privileged=data["privileged"],
            access_keys_count=data["keys"],
            login_count=data["logins"],
            console_login_profiles=data["profiles"],
            is_shared_account=data["shared"]
        )
        users.append(user)

    return users


def _create_cloudtrail_events() -> List[CloudTrailEvent]:
    """Create realistic CloudTrail events with change management scenarios"""
    now = datetime.utcnow()
    events = []

    event_templates = [
        # Authorized changes
        {"name": "CreateUser", "user": "admin-sarah", "resource": "IAM User", "approved": True,
         "emergency": False, "ticket": "CHG001234", "days_ago": 5},
        {"name": "AttachUserPolicy", "user": "admin-sarah", "resource": "IAM Policy", "approved": True,
         "emergency": False, "ticket": "CHG001235", "days_ago": 3},
        {"name": "UpdateRole", "user": "admin-sarah", "resource": "IAM Role", "approved": True,
         "emergency": False, "ticket": "CHG001236", "days_ago": 2},

        # Unauthorized changes (no approval)
        {"name": "PutRolePolicy", "user": "john.admin", "resource": "IAM Policy", "approved": False,
         "emergency": False, "ticket": None, "days_ago": 1},
        {"name": "AttachRolePolicy", "user": "john.admin", "resource": "IAM Role", "approved": False,
         "emergency": False, "ticket": None, "days_ago": 4},
        {"name": "CreatePolicy", "user": "mike.developer", "resource": "IAM Policy", "approved": False,
         "emergency": False, "ticket": None, "days_ago": 2},

        # Emergency changes
        {"name": "UpdateAssumeRolePolicy", "user": "admin-sarah", "resource": "IAM Role", "approved": True,
         "emergency": True, "ticket": "CHG001237", "days_ago": 1},
        {"name": "PutUserPolicy", "user": "john.admin", "resource": "IAM Policy", "approved": True,
         "emergency": True, "ticket": None, "days_ago": 1},  # Emergency without post-review
        {"name": "DeleteRole", "user": "emergency-admin", "resource": "IAM Role", "approved": True,
         "emergency": True, "ticket": "EMG0001", "days_ago": 1},

        # Changes without tickets
        {"name": "UpdateUser", "user": "legacy-admin", "resource": "IAM User", "approved": True,
         "emergency": False, "ticket": None, "days_ago": 6},
        {"name": "CreateRole", "user": "service.account", "resource": "IAM Role", "approved": True,
         "emergency": False, "ticket": None, "days_ago": 3},

        # Normal operations
        {"name": "ConsoleLogin", "user": "susan.finance", "resource": "AWS Console", "approved": True,
         "emergency": False, "ticket": None, "days_ago": 0},
        {"name": "PutObject", "user": "service.account", "resource": "S3", "approved": True,
         "emergency": False, "ticket": None, "days_ago": 0},
    ]

    for i, template in enumerate(event_templates):
        event = CloudTrailEvent(
            event_id=f"cloudtrail-event-{i + 1:04d}",
            event_name=template["name"],
            event_time=now - timedelta(days=template["days_ago"], hours=random.randint(0, 23)),
            username=template["user"],
            resource_type=template["resource"],
            resource_name=f"{template['resource'].lower()}-{random.randint(100, 999)}",
            source_ip=f"{random.randint(10, 200)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}",
            user_agent="console.amazonaws.com",
            request_params={"action": template["name"], "timestamp": str(now)},
            is_unauthorized=not template["approved"],
            has_approval=template["approved"],
            is_emergency=template["emergency"],
            ticket_number=template["ticket"]
        )
        events.append(event)

    return events


def _create_config_changes() -> List[ConfigChange]:
    """Create realistic configuration changes with compliance issues"""
    now = datetime.utcnow()
    configs = []

    config_templates = [
        # IAM Policy Changes
        {"resource": "policy-admin-full-access", "type": "AWS::IAM::Policy", "change": "AttachRolePolicy",
         "user": "john.admin", "approved": False, "ticket": None, "days": 1, "violation": "UNATHORIZED_POLICY_CHANGE"},
        {"resource": "policy-readonly-access", "type": "AWS::IAM::Policy", "change": "CreatePolicy",
         "user": "admin-sarah", "approved": True, "ticket": "CHG001238", "days": 4, "violation": None},

        # S3 Bucket Configuration (Public buckets)
        {"resource": "customer-data-backup", "type": "AWS::S3::Bucket", "change": "PutBucketAcl",
         "user": "service.account", "approved": False, "ticket": None, "days": 2, "violation": "PUBLIC_BUCKET_ACL"},
        {"resource": "logs-archive", "type": "AWS::S3::Bucket", "change": "PutBucketPolicy",
         "user": "john.admin", "approved": False, "ticket": None, "days": 5, "violation": "PUBLIC_BUCKET_POLICY"},
        {"resource": "internal-documents", "type": "AWS::S3::Bucket", "change": "PutBucketAcl",
         "user": "admin-sarah", "approved": True, "ticket": "CHG001239", "days": 3, "violation": None},

        # Security Group Changes (Open to internet)
        {"resource": "sg-production-db", "type": "AWS::EC2::SecurityGroup", "change": "AuthorizeSecurityGroupIngress",
         "user": "mike.developer", "approved": False, "ticket": None, "days": 1, "violation": "SG_OPEN_TO_INTERNET"},
        {"resource": "sg-web-app", "type": "AWS::EC2::SecurityGroup", "change": "AuthorizeSecurityGroupIngress",
         "user": "admin-sarah", "approved": True, "ticket": "CHG001240", "days": 7, "violation": None},

        # More violations
        {"resource": "backup-bucket", "type": "AWS::S3::Bucket", "change": "PutBucketAcl",
         "user": "legacy-admin", "approved": False, "ticket": None, "days": 10, "violation": "PUBLIC_BUCKET_ACL"},
        {"resource": "sg-dev-servers", "type": "AWS::EC2::SecurityGroup", "change": "AuthorizeSecurityGroupIngress",
         "user": "emergency-admin", "approved": False, "ticket": "EMG0002", "days": 1, "violation": "SG_OPEN_TO_INTERNET"},
    ]

    for i, template in enumerate(config_templates):
        config = ConfigChange(
            resource_id=template["resource"],
            resource_type=template["type"],
            change_type=f"{template['change']} - {'Unauthorized' if not template['approved'] else 'Approved'}",
            change_detail={"action": template["change"], "status": "completed", "violation": template["violation"]},
            changed_by=template["user"],
            changed_at=now - timedelta(days=template["days"]),
            is_approved=template["approved"],
            has_ticket=template["ticket"] is not None,
            ticket_number=template["ticket"],
            violation_type=template["violation"],
            severity="CRITICAL" if template.get("violation") else "LOW"
        )
        configs.append(config)

    return configs


def _load_change_requests() -> List[ChangeRequest]:
    """Load change requests from CSV file"""
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "change_requests.csv")
    requests = []

    if not os.path.exists(csv_path):
        print(f"Warning: change_requests.csv not found at {csv_path}")
        return requests

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cr = ChangeRequest(
                change_id=row["change_id"],
                approved=row["approved"].strip().lower() == "yes",
                emergency=row["emergency"].strip().lower() == "yes",
                implemented_by=row["implemented_by"],
                ticket_number=row.get("ticket_number", "").strip() or None,
                description=row.get("description", ""),
            )
            requests.append(cr)

    return requests


def _create_itgc_findings() -> List[ITGCFinding]:
    """Create ITGC findings based on the seeded data"""
    now = datetime.utcnow()

    findings_data = [
        # Access Control Findings
        {
            "type": "ACCESS", "rule_id": "ITGC-01", "rule_name": "Inactive User Account",
            "desc": "User 'audit.test' has not logged in for 180 days - dormant account",
            "severity": "HIGH", "source": "AWS IAM", "resource": "audit.test", "user": "audit.test",
            "control_id": "AC-01", "control_name": "Access Review - User Account Management", "sop": "ITGC-SOP-AC-001"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-01", "rule_name": "Inactive User Account",
            "desc": "User 'jane.smith' has not logged in for 120 days",
            "severity": "HIGH", "source": "AWS IAM", "resource": "jane.smith", "user": "jane.smith",
            "control_id": "AC-01", "control_name": "Access Review - User Account Management", "sop": "ITGC-SOP-AC-001"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-01", "rule_name": "Inactive User Account",
            "desc": "User 'bob.wilson' has not logged in for 200 days",
            "severity": "HIGH", "source": "AWS IAM", "resource": "bob.wilson", "user": "bob.wilson",
            "control_id": "AC-01", "control_name": "Access Review - User Account Management", "sop": "ITGC-SOP-AC-001"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-02", "rule_name": "Excessive Privileged Access",
            "desc": "Privileged user 'john.admin' has AdministratorAccess policy and no designated manager",
            "severity": "HIGH", "source": "AWS IAM", "resource": "john.admin", "user": "john.admin",
            "control_id": "AC-02", "control_name": "Privileged Access Management", "sop": "ITGC-SOP-AC-002"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-02", "rule_name": "Excessive Privileged Access",
            "desc": "Service account 'service.account' has AdministratorAccess - excessive permissions",
            "severity": "HIGH", "source": "AWS IAM", "resource": "service.account", "user": "service.account",
            "control_id": "AC-02", "control_name": "Privileged Access Management", "sop": "ITGC-SOP-AC-002"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-03", "rule_name": "Shared/Service Account Detection",
            "desc": "Account 'service.account' appears shared - 5 login profiles detected",
            "severity": "MEDIUM", "source": "AWS IAM", "resource": "service.account", "user": "service.account",
            "control_id": "AC-03", "control_name": "Shared Account Controls", "sop": "ITGC-SOP-AC-003"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-04", "rule_name": "MFA Not Enabled - Privileged User",
            "desc": "Privileged user 'john.admin' does not have MFA enabled - AdministratorAccess risk",
            "severity": "CRITICAL", "source": "AWS IAM", "resource": "john.admin", "user": "john.admin",
            "control_id": "AC-04", "control_name": "Multi-Factor Authentication", "sop": "ITGC-SOP-AC-004"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-04", "rule_name": "MFA Not Enabled - Privileged User",
            "desc": "Privileged user 'root-account' does not have MFA enabled",
            "severity": "CRITICAL", "source": "AWS IAM", "resource": "root-account", "user": "root-account",
            "control_id": "AC-04", "control_name": "Multi-Factor Authentication", "sop": "ITGC-SOP-AC-004"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-05", "rule_name": "Dormant Administrator Account",
            "desc": "Admin account 'legacy-admin' dormant for 180 days",
            "severity": "HIGH", "source": "AWS IAM", "resource": "legacy-admin", "user": "legacy-admin",
            "control_id": "AC-05", "control_name": "Administrative Account Review", "sop": "ITGC-SOP-AC-005"
        },
        {
            "type": "ACCESS", "rule_id": "ITGC-12", "rule_name": "Root User Activity Detected",
            "desc": "Root user 'root-account' has active access keys and no MFA",
            "severity": "CRITICAL", "source": "AWS IAM", "resource": "root-account", "user": "root-account",
            "control_id": "AC-06", "control_name": "Root Account Monitoring", "sop": "ITGC-SOP-AC-006"
        },

        # Change Management Findings
        {
            "type": "CHANGE", "rule_id": "ITGC-06", "rule_name": "Unauthorized Configuration Change",
            "desc": "Unauthorized IAM change 'PutRolePolicy' by john.admin - 2 changes without approval",
            "severity": "HIGH", "source": "CloudTrail", "resource": "IAM Policy", "user": "john.admin",
            "control_id": "CM-01", "control_name": "Change Management - Authorization", "sop": "ITGC-SOP-CM-001"
        },
        {
            "type": "CHANGE", "rule_id": "ITGC-06", "rule_name": "Unauthorized Configuration Change",
            "desc": "Unauthorized IAM change 'AttachRolePolicy' by john.admin",
            "severity": "HIGH", "source": "CloudTrail", "resource": "IAM Role", "user": "john.admin",
            "control_id": "CM-01", "control_name": "Change Management - Authorization", "sop": "ITGC-SOP-CM-001"
        },
        {
            "type": "CHANGE", "rule_id": "ITGC-06", "rule_name": "Unauthorized Configuration Change",
            "desc": "Unauthorized IAM change 'CreatePolicy' by mike.developer",
            "severity": "HIGH", "source": "CloudTrail", "resource": "IAM Policy", "user": "mike.developer",
            "control_id": "CM-01", "control_name": "Change Management - Authorization", "sop": "ITGC-SOP-CM-001"
        },
        {
            "type": "CHANGE", "rule_id": "ITGC-07", "rule_name": "Emergency Change Without Post-Review",
            "desc": "Emergency change 'PutUserPolicy' without post-review ticket",
            "severity": "HIGH", "source": "CloudTrail", "resource": "IAM Policy", "user": "john.admin",
            "control_id": "CM-02", "control_name": "Emergency Change Management", "sop": "ITGC-SOP-CM-002"
        },
        {
            "type": "CHANGE", "rule_id": "ITGC-08", "rule_name": "Change Without Ticket Reference",
            "desc": "Change 'UpdateUser' by legacy-admin has no associated ticket",
            "severity": "MEDIUM", "source": "CloudTrail", "resource": "IAM User", "user": "legacy-admin",
            "control_id": "CM-03", "control_name": "Change Tracking - Ticketing", "sop": "ITGC-SOP-CM-003"
        },
        {
            "type": "CHANGE", "rule_id": "ITGC-08", "rule_name": "Change Without Ticket Reference",
            "desc": "Change 'CreateRole' by service.account has no associated ticket",
            "severity": "MEDIUM", "source": "CloudTrail", "resource": "IAM Role", "user": "service.account",
            "control_id": "CM-03", "control_name": "Change Tracking - Ticketing", "sop": "ITGC-SOP-CM-003"
        },

        # Configuration Control Findings
        {
            "type": "CONFIG", "rule_id": "ITGC-09", "rule_name": "IAM Policy Change Without Approval",
            "desc": "Unauthorized IAM policy change: AttachRolePolicy by john.admin without CAB approval",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "policy-admin-full-access", "user": "john.admin",
            "control_id": "CM-04", "control_name": "IAM Policy Change Control", "sop": "ITGC-SOP-CM-004"
        },
        {
            "type": "CONFIG", "rule_id": "ITGC-10", "rule_name": "Public S3 Bucket Detected",
            "desc": "Public S3 bucket detected: customer-data-backup - sensitive data exposure risk",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "customer-data-backup", "user": "service.account",
            "control_id": "CF-01", "control_name": "Public Access Configuration", "sop": "ITGC-SOP-CF-001"
        },
        {
            "type": "CONFIG", "rule_id": "ITGC-10", "rule_name": "Public S3 Bucket Detected",
            "desc": "Public S3 bucket detected: logs-archive",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "logs-archive", "user": "john.admin",
            "control_id": "CF-01", "control_name": "Public Access Configuration", "sop": "ITGC-SOP-CF-001"
        },
        {
            "type": "CONFIG", "rule_id": "ITGC-10", "rule_name": "Public S3 Bucket Detected",
            "desc": "Public S3 bucket detected: backup-bucket",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "backup-bucket", "user": "legacy-admin",
            "control_id": "CF-01", "control_name": "Public Access Configuration", "sop": "ITGC-SOP-CF-001"
        },
        {
            "type": "CONFIG", "rule_id": "ITGC-11", "rule_name": "Security Group Open to Internet",
            "desc": "Security group open to internet: sg-production-db - 0.0.0.0/0 inbound access",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "sg-production-db", "user": "mike.developer",
            "control_id": "CF-02", "control_name": "Network Security Configuration", "sop": "ITGC-SOP-CF-002"
        },
        {
            "type": "CONFIG", "rule_id": "ITGC-11", "rule_name": "Security Group Open to Internet",
            "desc": "Security group open to internet: sg-dev-servers",
            "severity": "CRITICAL", "source": "AWS Config", "resource": "sg-dev-servers", "user": "emergency-admin",
            "control_id": "CF-02", "control_name": "Network Security Configuration", "sop": "ITGC-SOP-CF-002"
        },
    ]

    findings = []
    for i, data in enumerate(findings_data):
        finding = ITGCFinding(
            finding_type=data["type"],
            rule_id=data["rule_id"],
            rule_name=data["rule_name"],
            description=data["desc"],
            severity=data["severity"],
            status="OPEN",
            source=data["source"],
            resource_name=data["resource"],
            username=data["user"],
            detected_at=now - timedelta(days=random.randint(1, 14)),
            control_id=data["control_id"],
            control_name=data["control_name"],
            sop_reference=data["sop"],
            ai_risk_analysis={
                "risk": data["severity"],
                "auditImpact": "Pending AI analysis",
                "businessImpact": "Pending AI analysis",
                "recommendation": "Pending AI analysis",
                "soxRisk": "Pending SOX risk assessment",
                "regulatoryReferences": ["SOX 404", "ISO 27001"],
                "probability": 75,
                "detectionDifficulty": "Medium"
            }
        )
        findings.append(finding)

    return findings


if __name__ == "__main__":
    seed_database()