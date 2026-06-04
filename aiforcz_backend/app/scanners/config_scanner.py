"""
Config Monitor - AWS Configuration Monitoring
Checks for public S3 buckets, open security groups, IAM policy drift
"""
from typing import List, Dict, Any


class ConfigMonitor:
    """Monitor AWS configuration for ITGC violations"""

    @staticmethod
    def check_public_buckets(configs) -> List[Dict[str, Any]]:
        """Check for public S3 buckets"""
        findings = []
        for config in configs:
            if config.resource_type == "AWS::S3::Bucket" and not config.is_approved:
                findings.append({
                    "resource": config.resource_id,
                    "type": "PUBLIC_BUCKET",
                    "severity": "CRITICAL",
                    "description": f"Public S3 bucket detected: {config.resource_id}",
                    "changed_by": config.changed_by,
                    "changed_at": config.changed_at.isoformat() if config.changed_at else None,
                    "violation": config.violation_type,
                })
        return findings

    @staticmethod
    def check_open_security_groups(configs) -> List[Dict[str, Any]]:
        """Check for security groups open to 0.0.0.0/0"""
        findings = []
        for config in configs:
            if config.resource_type == "AWS::EC2::SecurityGroup" and not config.is_approved:
                findings.append({
                    "resource": config.resource_id,
                    "type": "OPEN_SECURITY_GROUP",
                    "severity": "CRITICAL",
                    "description": f"Security group open to internet: {config.resource_id}",
                    "changed_by": config.changed_by,
                    "changed_at": config.changed_at.isoformat() if config.changed_at else None,
                    "violation": config.violation_type,
                })
        return findings

    @staticmethod
    def check_policy_violations(configs) -> List[Dict[str, Any]]:
        """Check for IAM policy violations"""
        findings = []
        for config in configs:
            if "policy" in config.change_type.lower() and not config.is_approved:
                findings.append({
                    "resource": config.resource_id,
                    "type": "POLICY_VIOLATION",
                    "severity": "CRITICAL",
                    "description": f"IAM policy violation: {config.change_detail}",
                    "changed_by": config.changed_by,
                    "changed_at": config.changed_at.isoformat() if config.changed_at else None,
                })
        return findings

    @staticmethod
    def check_root_usage(configs) -> List[Dict[str, Any]]:
        """Check for root account usage"""
        findings = []
        for config in configs:
            if config.changed_by and 'root' in config.changed_by.lower():
                findings.append({
                    "resource": config.resource_id,
                    "type": "ROOT_USAGE",
                    "severity": "CRITICAL",
                    "description": f"Root account used for change: {config.change_type}",
                    "changed_by": config.changed_by,
                    "changed_at": config.changed_at.isoformat() if config.changed_at else None,
                })
        return findings

    @staticmethod
    def run_all_checks(configs) -> Dict[str, List[Dict[str, Any]]]:
        """Run all configuration checks"""
        return {
            "public_buckets": ConfigMonitor.check_public_buckets(configs),
            "open_security_groups": ConfigMonitor.check_open_security_groups(configs),
            "policy_violations": ConfigMonitor.check_policy_violations(configs),
            "root_usage": ConfigMonitor.check_root_usage(configs),
        }