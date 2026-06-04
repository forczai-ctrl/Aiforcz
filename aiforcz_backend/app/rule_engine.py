"""
ITGC Rule Engine - Core rules for monitoring IT General Controls

Access Controls Rules:
1. Inactive User - last_login > 90 days
2. Excessive Privilege - admin role without approved manager
3. Shared Accounts - multiple login profiles
4. MFA Not Enabled - privileged user without MFA
5. Dormant Admin - admin with no recent activity

Change Management Rules:
6. No Approval - change without approval
7. Emergency Change - emergency without post-review
8. Unauthorized Deployment - no ticket reference
9. Missing Change Document - no documentation

Configuration Control Rules:
10. MFA Disabled - MFA configuration not enforced
11. Public Access - publicly accessible resources
12. Policy Violation - IAM policy drift
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from .models import IAMUser, CloudTrailEvent, ConfigChange, ITGCFinding


class ITGCRuleEngine:
    """ITGC Rule Engine for detecting control violations"""

    RULES = {
        "ITGC-01": {
            "name": "Inactive User Account",
            "control_id": "AC-01",
            "control_name": "Access Review - User Account Management",
            "category": "ACCESS",
            "description": "User accounts inactive for more than 90 days should be disabled or removed",
            "severity": "HIGH",
            "sop": "ITGC-SOP-AC-001"
        },
        "ITGC-02": {
            "name": "Excessive Privileged Access",
            "control_id": "AC-02",
            "control_name": "Privileged Access Management",
            "category": "ACCESS",
            "description": "Users with privileged access must have documented manager approval",
            "severity": "HIGH",
            "sop": "ITGC-SOP-AC-002"
        },
        "ITGC-03": {
            "name": "Shared/Service Account Detection",
            "control_id": "AC-03",
            "control_name": "Shared Account Controls",
            "category": "ACCESS",
            "description": "Accounts accessed from multiple IPs or console profiles indicate shared usage",
            "severity": "MEDIUM",
            "sop": "ITGC-SOP-AC-003"
        },
        "ITGC-04": {
            "name": "MFA Not Enabled - Privileged User",
            "control_id": "AC-04",
            "control_name": "Multi-Factor Authentication",
            "category": "ACCESS",
            "description": "MFA must be enabled for all privileged user accounts",
            "severity": "CRITICAL",
            "sop": "ITGC-SOP-AC-004"
        },
        "ITGC-05": {
            "name": "Dormant Administrator Account",
            "control_id": "AC-05",
            "control_name": "Administrative Account Review",
            "category": "ACCESS",
            "description": "Admin accounts with no activity in 60 days should be reviewed",
            "severity": "HIGH",
            "sop": "ITGC-SOP-AC-005"
        },
        "ITGC-06": {
            "name": "Unauthorized Configuration Change",
            "control_id": "CM-01",
            "control_name": "Change Management - Authorization",
            "category": "CHANGE",
            "description": "Configuration changes must have proper authorization",
            "severity": "HIGH",
            "sop": "ITGC-SOP-CM-001"
        },
        "ITGC-07": {
            "name": "Emergency Change Without Post-Review",
            "control_id": "CM-02",
            "control_name": "Emergency Change Management",
            "category": "CHANGE",
            "description": "Emergency changes require post-implementation review within 48 hours",
            "severity": "HIGH",
            "sop": "ITGC-SOP-CM-002"
        },
        "ITGC-08": {
            "name": "Change Without Ticket Reference",
            "control_id": "CM-03",
            "control_name": "Change Tracking - Ticketing",
            "category": "CHANGE",
            "description": "All changes must have an associated ticket/change request",
            "severity": "MEDIUM",
            "sop": "ITGC-SOP-CM-003"
        },
        "ITGC-09": {
            "name": "IAM Policy Change Without Approval",
            "control_id": "CM-04",
            "control_name": "IAM Policy Change Control",
            "category": "CHANGE",
            "description": "IAM policy modifications require CAB approval",
            "severity": "CRITICAL",
            "sop": "ITGC-SOP-CM-004"
        },
        "ITGC-10": {
            "name": "Public S3 Bucket Detected",
            "control_id": "CF-01",
            "control_name": "Public Access Configuration",
            "category": "CONFIG",
            "description": "S3 buckets with public access pose data exposure risk",
            "severity": "CRITICAL",
            "sop": "ITGC-SOP-CF-001"
        },
        "ITGC-11": {
            "name": "Security Group Open to Internet",
            "control_id": "CF-02",
            "control_name": "Network Security Configuration",
            "category": "CONFIG",
            "description": "Security groups should not allow unrestricted inbound access",
            "severity": "CRITICAL",
            "sop": "ITGC-SOP-CF-002"
        },
        "ITGC-12": {
            "name": "Root User Activity Detected",
            "control_id": "AC-06",
            "control_name": "Root Account Monitoring",
            "category": "ACCESS",
            "description": "Root user activity must be monitored and restricted",
            "severity": "CRITICAL",
            "sop": "ITGC-SOP-AC-006"
        }
    }

    def __init__(self):
        pass

    def evaluate_access_controls(self, users: List[IAMUser]) -> List[Dict[str, Any]]:
        """Evaluate access control rules against IAM users"""
        findings = []
        now = datetime.utcnow()

        for user in users:
            # Rule ITGC-01: Inactive User Account (>90 days no login)
            if user.last_login and (now - user.last_login).days > 90:
                findings.append(self._create_finding(
                    "ITGC-01", user, 
                    f"User '{user.username}' has not logged in for {(now - user.last_login).days} days"
                ))

            # Rule ITGC-02: Excessive Privileged Access
            if user.is_privileged and not user.manager:
                findings.append(self._create_finding(
                    "ITGC-02", user,
                    f"Privileged user '{user.username}' has no designated manager approval"
                ))

            # Rule ITGC-03: Shared Account
            if user.console_login_profiles and user.console_login_profiles > 2:
                findings.append(self._create_finding(
                    "ITGC-03", user,
                    f"Account '{user.username}' appears shared - {user.console_login_profiles} login profiles detected"
                ))

            # Rule ITGC-04: MFA Not Enabled for Privileged Users
            if user.is_privileged and not user.mfa_enabled:
                findings.append(self._create_finding(
                    "ITGC-04", user,
                    f"Privileged user '{user.username}' does not have MFA enabled"
                ))

            # Rule ITGC-05: Dormant Administrator
            if user.is_privileged and user.last_login and (now - user.last_login).days > 60:
                findings.append(self._create_finding(
                    "ITGC-05", user,
                    f"Admin account '{user.username}' dormant for {(now - user.last_login).days} days"
                ))

        return findings

    def evaluate_change_management(self, events: List[CloudTrailEvent]) -> List[Dict[str, Any]]:
        """Evaluate change management rules against cloud trail events"""
        findings = []

        for event in events:
            # Rule ITGC-06: Unauthorized Configuration Change
            if not event.has_approval and event.event_name in [
                'CreateRole', 'UpdateRole', 'PutRolePolicy',
                'CreateUser', 'UpdateUser', 'PutUserPolicy',
                'CreateGroup', 'UpdateGroup', 'PutGroupPolicy',
                'CreatePolicy', 'UpdatePolicy',
                'AttachRolePolicy', 'AttachUserPolicy', 'AttachGroupPolicy',
                'DeleteRole', 'DeleteUser', 'DeleteGroup',
                'UpdateAssumeRolePolicy'
            ]:
                findings.append(self._create_finding_from_event(
                    "ITGC-06", event,
                    f"Unauthorized IAM change '{event.event_name}' by {event.username}"
                ))

            # Rule ITGC-07: Emergency Change Without Post-Review
            if event.is_emergency and not event.ticket_number:
                findings.append(self._create_finding_from_event(
                    "ITGC-07", event,
                    f"Emergency change '{event.event_name}' without post-review ticket"
                ))

            # Rule ITGC-08: Change Without Ticket
            if not event.ticket_number and not event.is_emergency:
                findings.append(self._create_finding_from_event(
                    "ITGC-08", event,
                    f"Change '{event.event_name}' by {event.username} has no associated ticket"
                ))

        return findings

    def evaluate_configuration_controls(self, configs: List[ConfigChange]) -> List[Dict[str, Any]]:
        """Evaluate configuration control rules"""
        findings = []

        for config in configs:
            # Rule ITGC-09: IAM Policy Change Without Approval
            if "policy" in config.change_type.lower() and not config.is_approved:
                findings.append(self._create_finding_from_config(
                    "ITGC-09", config,
                    f"Unauthorized policy change: {config.change_detail}"
                ))

            # Rule ITGC-10: Public S3 Bucket
            if config.resource_type == "AWS::S3::Bucket" and not config.is_approved:
                findings.append(self._create_finding_from_config(
                    "ITGC-10", config,
                    f"Public S3 bucket detected: {config.resource_id}"
                ))

            # Rule ITGC-11: Security Group Open to Internet
            if config.resource_type == "AWS::EC2::SecurityGroup" and not config.is_approved:
                findings.append(self._create_finding_from_config(
                    "ITGC-11", config,
                    f"Security group open to internet: {config.resource_id}"
                ))

        return findings

    def _create_finding(self, rule_id: str, user: IAMUser, description: str) -> Dict[str, Any]:
        rule = self.RULES[rule_id]
        return {
            "finding_type": rule["category"],
            "rule_id": rule_id,
            "rule_name": rule["name"],
            "description": description,
            "severity": rule["severity"],
            "status": "OPEN",
            "source": "AWS IAM",
            "resource_name": user.username,
            "username": user.username,
            "control_id": rule["control_id"],
            "control_name": rule["control_name"],
            "sop_reference": rule["sop"]
        }

    def _create_finding_from_event(self, rule_id: str, event: CloudTrailEvent, description: str) -> Dict[str, Any]:
        rule = self.RULES[rule_id]
        return {
            "finding_type": rule["category"],
            "rule_id": rule_id,
            "rule_name": rule["name"],
            "description": description,
            "severity": rule["severity"],
            "status": "OPEN",
            "source": "CloudTrail",
            "resource_name": event.resource_name or event.event_name,
            "username": event.username,
            "control_id": rule["control_id"],
            "control_name": rule["control_name"],
            "sop_reference": rule["sop"]
        }

    def _create_finding_from_config(self, rule_id: str, config: ConfigChange, description: str) -> Dict[str, Any]:
        rule = self.RULES[rule_id]
        return {
            "finding_type": rule["category"],
            "rule_id": rule_id,
            "rule_name": rule["name"],
            "description": description,
            "severity": rule["severity"],
            "status": "OPEN",
            "source": "AWS Config",
            "resource_name": config.resource_id,
            "username": config.changed_by,
            "control_id": rule["control_id"],
            "control_name": rule["control_name"],
            "sop_reference": rule["sop"]
        }