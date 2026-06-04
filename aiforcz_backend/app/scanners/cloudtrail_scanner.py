"""
CloudTrail Analyzer - CloudTrail Event Analysis
Detects policy changes, security changes, unauthorized activities
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any


class CloudTrailAnalyzer:
    """Analyze CloudTrail events for ITGC violations"""

    # Events that indicate policy changes
    POLICY_CHANGE_EVENTS = [
        'AttachUserPolicy', 'DetachUserPolicy', 'AttachRolePolicy', 'DetachRolePolicy',
        'AttachGroupPolicy', 'DetachGroupPolicy', 'CreatePolicy', 'DeletePolicy',
        'CreatePolicyVersion', 'DeletePolicyVersion', 'SetDefaultPolicyVersion',
    ]

    # Events that indicate security changes
    SECURITY_CHANGE_EVENTS = [
        'AuthorizeSecurityGroupIngress', 'AuthorizeSecurityGroupEgress',
        'RevokeSecurityGroupIngress', 'RevokeSecurityGroupEgress',
        'PutBucketPolicy', 'PutBucketAcl', 'DeleteBucketPolicy',
        'CreateNetworkAcl', 'DeleteNetworkAcl', 'ReplaceNetworkAclEntry',
    ]

    # Events that indicate IAM changes
    IAM_CHANGE_EVENTS = [
        'CreateUser', 'DeleteUser', 'UpdateUser', 'CreateRole', 'DeleteRole',
        'UpdateRole', 'CreateGroup', 'DeleteGroup', 'UpdateGroup',
        'PutUserPolicy', 'PutRolePolicy', 'PutGroupPolicy',
        'UpdateAssumeRolePolicy',
    ]

    @staticmethod
    def analyze_events(events) -> List[Dict[str, Any]]:
        """Analyze CloudTrail events for ITGC issues"""
        findings = []

        for event in events:
            # Detect policy changes
            if event.event_name in CloudTrailAnalyzer.POLICY_CHANGE_EVENTS:
                finding = {
                    "event": event.event_name,
                    "user": event.username,
                    "time": event.event_time.isoformat() if event.event_time else None,
                    "type": "POLICY_CHANGE",
                    "severity": "HIGH",
                    "description": f"Policy change '{event.event_name}' by {event.username}",
                    "is_unauthorized": event.is_unauthorized,
                    "resource": event.resource_name,
                }
                if event.is_unauthorized:
                    finding["severity"] = "CRITICAL"
                    finding["description"] = f"Unauthorized policy change '{event.event_name}' by {event.username}"
                findings.append(finding)

            # Detect security changes
            if event.event_name in CloudTrailAnalyzer.SECURITY_CHANGE_EVENTS:
                finding = {
                    "event": event.event_name,
                    "user": event.username,
                    "time": event.event_time.isoformat() if event.event_time else None,
                    "type": "SECURITY_CHANGE",
                    "severity": "HIGH",
                    "description": f"Security configuration change '{event.event_name}' by {event.username}",
                    "is_unauthorized": event.is_unauthorized,
                    "resource": event.resource_name,
                }
                if not event.is_unauthorized:
                    finding["severity"] = "MEDIUM"
                findings.append(finding)

            # Detect IAM changes
            if event.event_name in CloudTrailAnalyzer.IAM_CHANGE_EVENTS:
                finding = {
                    "event": event.event_name,
                    "user": event.username,
                    "time": event.event_time.isoformat() if event.event_time else None,
                    "type": "IAM_CHANGE",
                    "severity": "MEDIUM",
                    "description": f"IAM change '{event.event_name}' by {event.username}",
                    "is_unauthorized": event.is_unauthorized,
                    "resource": event.resource_name,
                }
                if event.is_unauthorized:
                    finding["severity"] = "HIGH"
                findings.append(finding)

        return findings

    @staticmethod
    def detect_root_activity(events) -> List[Dict[str, Any]]:
        """Detect root user activity"""
        root_activities = []
        for event in events:
            if event.username and 'root' in event.username.lower():
                root_activities.append({
                    "event": event.event_name,
                    "time": event.event_time.isoformat() if event.event_time else None,
                    "severity": "CRITICAL",
                    "description": f"Root user activity detected: {event.event_name}",
                })
        return root_activities

    @staticmethod
    def detect_console_login_events(events) -> List[Dict[str, Any]]:
        """Detect console login events"""
        logins = []
        for event in events:
            if event.event_name == 'ConsoleLogin':
                logins.append({
                    "user": event.username,
                    "time": event.event_time.isoformat() if event.event_time else None,
                    "type": "CONSOLE_LOGIN",
                })
        return logins