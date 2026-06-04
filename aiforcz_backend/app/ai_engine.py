"""
AI Risk Assessment Engine for ITGC Findings

Uses LLM (OpenAI GPT) to analyze ITGC findings and provide:
1. Audit impact analysis
2. Business impact assessment
3. Root cause analysis
4. Remediation recommendations
5. SOX risk prediction
"""

import json
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class AIRiskEngine:
    """AI-powered risk analysis for ITGC findings"""

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.use_llm = bool(self.openai_api_key)

    def analyze_finding(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze an ITGC finding and provide AI-powered risk assessment.
        
        If OpenAI API key is configured, uses GPT-4o for analysis.
        Otherwise, uses rule-based analysis as fallback.
        """
        if self.use_llm:
            return self._llm_analysis(finding)
        else:
            return self._rule_based_analysis(finding)

    def analyze_findings_batch(self, findings: list) -> list:
        """Analyze multiple findings"""
        return [self.analyze_finding(f) for f in findings]

    def _llm_analysis(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Use OpenAI GPT to analyze finding"""
        try:
            import openai
            openai.api_key = self.openai_api_key

            prompt = f"""You are an ITGC (IT General Controls) audit expert. Analyze the following ITGC finding and provide assessment.

Finding Details:
- Rule: {finding.get('rule_id')} - {finding.get('rule_name')}
- Description: {finding.get('description')}
- Severity: {finding.get('severity')}
- Control: {finding.get('control_id')} - {finding.get('control_name')}
- Resource: {finding.get('resource_name')}
- User: {finding.get('username', 'N/A')}
- Source: {finding.get('source')}

Provide analysis in JSON format:
{{
    "risk": "Critical/High/Medium/Low",
    "auditImpact": "Detailed audit impact",
    "businessImpact": "Detailed business impact",
    "rootCause": "Root cause analysis",
    "recommendation": "Specific remediation steps",
    "soxRisk": "SOX compliance impact",
    "regulatoryReferences": ["List of relevant regulations"],
    "probability": "Likelihood of occurrence (0-100)",
    "detectionDifficulty": "How hard to detect in audit (Easy/Medium/Hard)"
}}"""

            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an ITGC audit expert. Provide concise, actionable risk analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            analysis_text = response.choices[0].message.content
            # Extract JSON from response
            if "```json" in analysis_text:
                analysis_text = analysis_text.split("```json")[1].split("```")[0]
            elif "```" in analysis_text:
                analysis_text = analysis_text.split("```")[1].split("```")[0]
            
            analysis = json.loads(analysis_text.strip())
            return analysis

        except Exception as e:
            print(f"LLM analysis failed: {e}. Falling back to rule-based analysis.")
            return self._rule_based_analysis(finding)

    def _rule_based_analysis(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback analysis when LLM is not available"""
        rule_id = finding.get("rule_id", "")
        severity = finding.get("severity", "MEDIUM")

        analysis_map = {
            "ITGC-01": {
                "risk": "Medium",
                "auditImpact": "Inactive accounts increase audit risk. Auditors will flag these as access control deficiencies.",
                "businessImpact": "Inactive accounts can be exploited by malicious actors, leading to unauthorized access.",
                "rootCause": "No automated account lifecycle management process",
                "recommendation": "Review and disable inactive accounts. Implement automated account deactivation policy.",
                "soxRisk": "Potential SOX 404 deficiency in access controls",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2", "NIST AC-2"],
                "probability": 75,
                "detectionDifficulty": "Easy"
            },
            "ITGC-02": {
                "risk": "High",
                "auditImpact": "Privileged access without approval is a significant audit finding indicating weak SoD controls.",
                "businessImpact": "Unauthorized privileged access can lead to data breaches and financial misstatements.",
                "rootCause": "No formal privileged access approval workflow",
                "recommendation": "Immediately review and approve all privileged access. Implement JIT privileged access management.",
                "soxRisk": "Critical SOX deficiency - direct impact on financial reporting systems",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2.3", "NIST AC-5", "PCI DSS 7.1"],
                "probability": 85,
                "detectionDifficulty": "Medium"
            },
            "ITGC-03": {
                "risk": "Medium",
                "auditImpact": "Shared accounts compromise audit trail and non-repudiation.",
                "businessImpact": "Cannot attribute actions to specific individuals, increasing fraud risk.",
                "rootCause": "Shared credentials for convenience",
                "recommendation": "Disable shared accounts. Implement individual accounts with SSO.",
                "soxRisk": "Controls deficiency - impacts audit trail reliability",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2.1", "NIST AC-14"],
                "probability": 65,
                "detectionDifficulty": "Medium"
            },
            "ITGC-04": {
                "risk": "Critical",
                "auditImpact": "Missing MFA on privileged accounts is a critical control deficiency that will be flagged in any audit.",
                "businessImpact": "Single-factor authentication on privileged accounts exposes the organization to credential theft and account takeover.",
                "rootCause": "MFA not enforced at the organization level",
                "recommendation": "Enable MFA immediately for all privileged accounts. Implement conditional access policies.",
                "soxRisk": "Critical SOX deficiency - fundamental access control failure",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.4.2", "NIST IA-2(1)", "PCI DSS 8.3"],
                "probability": 90,
                "detectionDifficulty": "Easy"
            },
            "ITGC-05": {
                "risk": "High",
                "auditImpact": "Dormant admin accounts are high-risk findings indicating poor account lifecycle management.",
                "businessImpact": "Dormant admin accounts are prime targets for attackers seeking elevated privileges.",
                "rootCause": "No regular review of administrative accounts",
                "recommendation": "Review all dormant admin accounts. Disable or remove unnecessary privileged access.",
                "soxRisk": "High SOX risk - impacts financial system access controls",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2.5", "NIST AC-2(3)"],
                "probability": 70,
                "detectionDifficulty": "Easy"
            },
            "ITGC-06": {
                "risk": "High",
                "auditImpact": "Unauthorized IAM changes indicate change management control failure.",
                "businessImpact": "Unauthorized changes can lead to security breaches and system instability.",
                "rootCause": "Change control process not followed for IAM changes",
                "recommendation": "Implement mandatory change approval workflow. Use infrastructure as code.",
                "soxRisk": "High SOX risk - change management controls are foundational",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.12.1.2", "NIST CM-3", "ITIL Change Management"],
                "probability": 80,
                "detectionDifficulty": "Medium"
            },
            "ITGC-07": {
                "risk": "High",
                "auditImpact": "Emergency changes without post-review are audit findings indicating weak change management.",
                "businessImpact": "Emergency changes bypass controls, increasing operational risk.",
                "rootCause": "No post-implementation review process for emergency changes",
                "recommendation": "Implement mandatory post-review within 48 hours for all emergency changes.",
                "soxRisk": "High SOX risk - emergency change controls must include post-review",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.12.1.2", "NIST CM-3(2)", "ITIL Emergency Change"],
                "probability": 60,
                "detectionDifficulty": "Medium"
            },
            "ITGC-08": {
                "risk": "Medium",
                "auditImpact": "Changes without tickets indicate weak change tracking and audit trail issues.",
                "businessImpact": "Cannot trace changes back to authorized requests, increasing error risk.",
                "rootCause": "Ticketing process not integrated with change deployment",
                "recommendation": "Enforce ticket reference requirement for all changes. Integrate ITSM with deployment pipeline.",
                "soxRisk": "Medium SOX risk - impacts change traceability",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.12.1.2", "ITIL Change Management"],
                "probability": 55,
                "detectionDifficulty": "Easy"
            },
            "ITGC-09": {
                "risk": "Critical",
                "auditImpact": "IAM policy changes without CAB approval are critical audit findings.",
                "businessImpact": "Unauthorized policy changes can grant excessive permissions or expose resources.",
                "rootCause": "IAM change management not enforced",
                "recommendation": "Implement CAB approval for all IAM policy changes. Use change management workflow.",
                "soxRisk": "Critical SOX deficiency - IAM is foundation of IT controls",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2.3", "NIST AC-5", "NIST CM-5"],
                "probability": 85,
                "detectionDifficulty": "Medium"
            },
            "ITGC-10": {
                "risk": "Critical",
                "auditImpact": "Public S3 buckets are critical audit findings indicating data protection control failure.",
                "businessImpact": "Public buckets can expose sensitive data, leading to regulatory fines and reputational damage.",
                "rootCause": "Public access not blocked at organizational level",
                "recommendation": "Block all public S3 access using SCP. Implement S3 Block Public Access feature.",
                "soxRisk": "Critical SOX deficiency - data protection controls failure",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.8.2.1", "NIST AC-3", "PCI DSS 7.1", "GDPR Article 32"],
                "probability": 95,
                "detectionDifficulty": "Easy"
            },
            "ITGC-11": {
                "risk": "Critical",
                "auditImpact": "Security groups open to internet are critical findings indicating network security control failure.",
                "businessImpact": "Open security groups expose systems to unauthorized network access and potential compromise.",
                "rootCause": "No network security group review process",
                "recommendation": "Restrict inbound access to specific IPs. Implement security group review workflow.",
                "soxRisk": "Critical SOX deficiency - network security controls failure",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.13.1.1", "NIST SC-7", "PCI DSS 1.3"],
                "probability": 90,
                "detectionDifficulty": "Easy"
            },
            "ITGC-12": {
                "risk": "Critical",
                "auditImpact": "Root user activity is a critical audit finding that will be flagged in any compliance review.",
                "businessImpact": "Root user has unrestricted access. Any activity poses severe security and compliance risk.",
                "rootCause": "Root user monitoring and controls not implemented",
                "recommendation": "Enable root user MFA. Set up root user activity alerts. Consider removing root access keys.",
                "soxRisk": "Critical SOX deficiency - privileged access management failure",
                "regulatoryReferences": ["SOX 404", "ISO 27001 A.9.2.3", "NIST AC-6(5)", "AWS Well-Architected"],
                "probability": 95,
                "detectionDifficulty": "Easy"
            }
        }

        default_analysis = {
            "risk": severity,
            "auditImpact": f"Control deficiency detected - {finding.get('rule_name', 'ITGC Issue')}. Requires remediation before audit.",
            "businessImpact": "Control weakness may impact compliance posture and increase operational risk.",
            "rootCause": "Control process not effectively implemented or monitored",
            "recommendation": "Review and remediate based on documented SOP",
            "soxRisk": "Potential SOX 404 deficiency depending on materiality",
            "regulatoryReferences": ["SOX 404", "ISO 27001"],
            "probability": 70,
            "detectionDifficulty": "Medium"
        }

        analysis = analysis_map.get(rule_id, default_analysis)
        
        # Adjust risk based on severity
        severity_risk_map = {
            "CRITICAL": "Critical",
            "HIGH": "High",
            "MEDIUM": "Medium",
            "LOW": "Low"
        }
        
        analysis["risk"] = severity_risk_map.get(severity, analysis.get("risk", "Medium"))
        
        return analysis

    def predict_audit_findings(self, findings: list) -> Dict[str, Any]:
        """
        Predict likely audit findings based on current ITGC issues.
        """
        open_count = len([f for f in findings if f.get("status") == "OPEN"])
        critical_count = len([f for f in findings if f.get("severity") == "CRITICAL"])
        high_count = len([f for f in findings if f.get("severity") == "HIGH"])
        
        audit_readiness = max(0, 100 - (critical_count * 15 + high_count * 5 + open_count * 2))
        
        return {
            "auditReadiness": min(100, audit_readiness),
            "predictedFindings": min(open_count, critical_count + high_count),
            "criticalIssues": critical_count,
            "highIssues": high_count,
            "overallRisk": "High" if critical_count > 0 else ("Medium" if high_count > 3 else "Low"),
            "recommendation": "Immediate remediation required" if critical_count > 0 else "Schedule remediation in next sprint"
        }

    def generate_remediation_plan(self, findings: list) -> list:
        """Generate prioritized remediation plan"""
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        
        prioritized = sorted(findings, key=lambda f: severity_order.get(f.get("severity", "LOW"), 99))
        
        plans = []
        for i, finding in enumerate(prioritized[:10]):  # Top 10 findings
            analysis = self.analyze_finding(finding)
            plans.append({
                "priority": i + 1,
                "finding": finding.get("rule_name", "Unknown"),
                "description": finding.get("description", ""),
                "severity": finding.get("severity", "MEDIUM"),
                "risk": analysis.get("risk", "Medium"),
                "recommendation": analysis.get("recommendation", "Review and remediate"),
                "targetDate": f"Day {i + 1}",
                "status": "Pending"
            })
        
        return plans