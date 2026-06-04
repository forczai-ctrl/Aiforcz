"""
IAM Scanner - AWS IAM User & Policy Scanner
Collects IAM user data, MFA status, last login, groups, policies
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


class IAMScanner:
    """IAM Scanner for collecting user access data"""

    @staticmethod
    def scan_users(db_users) -> List[Dict[str, Any]]:
        """Process IAM users from database into scanner format"""
        results = []
        for user in db_users:
            results.append({
                "user": user.username,
                "email": user.email,
                "role": user.role,
                "department": user.department,
                "mfa": user.mfa_enabled,
                "admin": user.is_privileged,
                "lastLogin": user.last_login.isoformat() if user.last_login else None,
                "isActive": user.is_active,
                "manager": user.manager,
                "isShared": user.is_shared_account,
                "accessKeysCount": user.access_keys_count,
                "loginCount": user.login_count,
            })
        return results

    @staticmethod
    def identify_risks(users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify access control risks from scanned users"""
        now = datetime.utcnow()
        risks = []

        for u in users:
            # Admin without MFA
            if u.get("admin") and not u.get("mfa"):
                risks.append({
                    "type": "ACCESS",
                    "severity": "CRITICAL",
                    "finding": f"Admin user '{u['user']}' without MFA",
                    "user": u["user"],
                    "rule": "Admin without MFA"
                })

            # Dormant admin
            if u.get("admin") and u.get("lastLogin"):
                last = datetime.fromisoformat(u["lastLogin"].replace("Z", "+00:00"))
                days = (now - last).days
                if days > 60:
                    risks.append({
                        "type": "ACCESS",
                        "severity": "HIGH",
                        "finding": f"Dormant admin account '{u['user']}' - {days} days inactive",
                        "user": u["user"],
                        "rule": "Dormant Admin"
                    })

            # Unused accounts (>180 days)
            if u.get("lastLogin"):
                last = datetime.fromisoformat(u["lastLogin"].replace("Z", "+00:00"))
                days = (now - last).days
                if days > 180:
                    risks.append({
                        "type": "ACCESS",
                        "severity": "HIGH",
                        "finding": f"Unused account '{u['user']}' - {days} days since last login",
                        "user": u["user"],
                        "rule": "Unused Account"
                    })

            # Inactive accounts (>90 days)
            if u.get("lastLogin"):
                last = datetime.fromisoformat(u["lastLogin"].replace("Z", "+00:00"))
                days = (now - last).days
                if days > 90:
                    risks.append({
                        "type": "ACCESS",
                        "severity": "MEDIUM",
                        "finding": f"Inactive account '{u['user']}' - {days} days no login",
                        "user": u["user"],
                        "rule": "Inactive Account"
                    })

            # Shared/service accounts
            if u.get("isShared"):
                risks.append({
                    "type": "ACCESS",
                    "severity": "MEDIUM",
                    "finding": f"Shared/service account '{u['user']}' violates non-repudiation",
                    "user": u["user"],
                    "rule": "Shared Account"
                })

            # No manager for privileged
            if u.get("admin") and not u.get("manager"):
                risks.append({
                    "type": "ACCESS",
                    "severity": "HIGH",
                    "finding": f"Privileged user '{u['user']}' has no designated manager",
                    "user": u["user"],
                    "rule": "Excessive Permissions"
                })

        return risks