"""
Audit Copilot - RAG-based conversational AI for ITGC questions
Uses finding data, CloudTrail logs, AWS Config results as context
"""
import json
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()


class AuditCopilot:
    """Conversational AI copilot for ITGC audit questions"""

    def __init__(self, db_session=None):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.use_llm = bool(self.openai_api_key)
        self.db = db_session

    def set_db(self, db_session):
        """Set database session for context gathering"""
        self.db = db_session

    def answer_question(self, question: str, context_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Answer an audit-related question using RAG approach.
        Gathers context from findings, then uses LLM or rule-based response.
        """
        # Gather context from database if available
        context = context_data or {}
        if self.db and not context_data:
            context = self._gather_context()

        if self.use_llm:
            return self._llm_answer(question, context)
        else:
            return self._rule_based_answer(question, context)

    def _gather_context(self) -> Dict[str, Any]:
        """Gather context from database for RAG"""
        from .models import ITGCFinding, IAMUser, CloudTrailEvent, ConfigChange

        context = {}

        # Get open findings
        findings = self.db.query(ITGCFinding).filter(ITGCFinding.status == "OPEN").all()
        context["open_findings"] = [
            {
                "rule_id": f.rule_id,
                "rule_name": f.rule_name,
                "severity": f.severity,
                "description": f.description,
                "finding_type": f.finding_type,
            }
            for f in findings
        ]

        # Get users
        users = self.db.query(IAMUser).all()
        context["users"] = [
            {
                "username": u.username,
                "role": u.role,
                "mfa_enabled": u.mfa_enabled,
                "is_privileged": u.is_privileged,
                "last_login": str(u.last_login) if u.last_login else None,
                "is_active": u.is_active,
                "is_shared_account": u.is_shared_account,
            }
            for u in users
        ]

        # Get recent cloudtrail events
        events = self.db.query(CloudTrailEvent).order_by(CloudTrailEvent.event_time.desc()).limit(20).all()
        context["recent_events"] = [
            {
                "event_name": e.event_name,
                "username": e.username,
                "is_unauthorized": e.is_unauthorized,
                "is_emergency": e.is_emergency,
                "event_time": str(e.event_time) if e.event_time else None,
            }
            for e in events
        ]

        # Get config changes
        configs = self.db.query(ConfigChange).filter(ConfigChange.is_approved == False).all()
        context["config_violations"] = [
            {
                "resource_id": c.resource_id,
                "resource_type": c.resource_type,
                "violation_type": c.violation_type,
                "changed_by": c.changed_by,
            }
            for c in configs
        ]

        # Summary stats
        context["summary"] = {
            "total_open": len([f for f in findings if f.status == "OPEN"]),
            "critical": len([f for f in findings if f.severity == "CRITICAL"]),
            "high": len([f for f in findings if f.severity == "HIGH"]),
            "total_users": len(users),
            "mfa_disabled": len([u for u in users if not u.mfa_enabled]),
            "dormant_admins": len([u for u in users if u.is_privileged and u.last_login and 
                                 (__import__('datetime').datetime.utcnow() - u.last_login).days > 60]),
        }

        # Calculate audit readiness
        c = context["summary"]["critical"]
        h = context["summary"]["high"]
        o = context["summary"]["total_open"]
        context["summary"]["audit_readiness"] = max(0, min(100, 100 - (c * 15 + h * 5 + o * 2)))

        return context

    def _llm_answer(self, question: str, context: Dict) -> Dict[str, Any]:
        """Use LLM to answer audit question"""
        try:
            import openai
            openai.api_key = self.openai_api_key

            summary = context.get("summary", {})
            findings_context = json.dumps(context.get("open_findings", [])[:10], indent=2)
            users_context = json.dumps(context.get("users", [])[:10], indent=2)

            prompt = f"""You are an ITGC Audit Copilot AI. Answer the auditor's question using the provided context.

Current ITGC Status:
- Audit Readiness: {summary.get('audit_readiness', 'N/A')}%
- Open Findings: {summary.get('total_open', 0)}
- Critical: {summary.get('critical', 0)}
- High: {summary.get('high', 0)}
- Total Users: {summary.get('total_users', 0)}
- MFA Disabled: {summary.get('mfa_disabled', 0)}

Recent Findings:
{findings_context}

Users:
{users_context}

Question: {question}

Provide a concise, specific answer based on the data. If the data doesn't contain the answer, say so."""

            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an ITGC audit copilot. Answer questions concisely and specifically based on the provided data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            answer = response.choices[0].message.content
            return {
                "question": question,
                "answer": answer,
                "context_used": True,
                "source": "LLM"
            }

        except Exception as e:
            print(f"LLM copilot failed: {e}. Falling back to rule-based.")
            return self._rule_based_answer(question, context)

    def _rule_based_answer(self, question: str, context: Dict) -> Dict[str, Any]:
        """Rule-based fallback for copilot questions"""
        question_lower = question.lower()
        summary = context.get("summary", {})
        findings = context.get("open_findings", [])
        users = context.get("users", [])
        configs = context.get("config_violations", [])

        answer = ""
        source = "Rule-based analysis of findings data"

        # Question routing
        if "readiness" in question_lower or "how ready" in question_lower or "audit score" in question_lower:
            ar = summary.get("audit_readiness", 70)
            reasons = []
            if summary.get("critical", 0) > 0:
                reasons.append(f"{summary['critical']} critical findings (each reduces score by 15%)")
            if summary.get("high", 0) > 0:
                reasons.append(f"{summary['high']} high findings (each reduces score by 5%)")
            if summary.get("total_open", 0) > 0:
                reasons.append(f"{summary['total_open']} total open findings (each reduces score by 2%)")
            
            answer = f"Audit Readiness is currently {ar}%. "
            if reasons:
                answer += "Key factors reducing the score: " + "; ".join(reasons) + ". "
            if ar < 70:
                answer += "Immediate remediation of critical findings is recommended to improve readiness."
            else:
                answer += "Continue monitoring and remediate open findings to maintain compliance."

        elif "dormant" in question_lower or "inactive" in question_lower:
            dormant = [u for u in users if u.get("is_privileged", False) and u.get("last_login")]
            if dormant:
                answer = f"Found {len(dormant)} dormant admin accounts: "
                answer += ", ".join([u["username"] for u in dormant[:5]])
                answer += ". These accounts pose security risk and should be reviewed."
            else:
                answer = "No dormant admin accounts detected."

        elif "sox" in question_lower or "audit finding" in question_lower or "likely" in question_lower:
            critical = [f for f in findings if f.get("severity") == "CRITICAL"]
            high = [f for f in findings if f.get("severity") == "HIGH"]
            if critical:
                answer = f"Likely audit findings (SOX-relevant):\n"
                for f in critical[:5]:
                    answer += f"- CRITICAL: {f.get('rule_name', 'Unknown')}: {f.get('description', '')}\n"
                if high:
                    answer += f"\nAdditionally, {len(high)} HIGH severity findings may be flagged."
            else:
                answer = "No critical findings detected. SOX compliance posture appears manageable."

        elif "mfa" in question_lower:
            mfa_off = [u for u in users if not u.get("mfa_enabled", True)]
            privileged_mfa_off = [u for u in mfa_off if u.get("is_privileged", False)]
            if privileged_mfa_off:
                answer = f"{len(privileged_mfa_off)} privileged users without MFA: "
                answer += ", ".join([u["username"] for u in privileged_mfa_off[:5]])
                answer += ". This is a critical audit finding."
            elif mfa_off:
                answer = f"{len(mfa_off)} non-privileged users without MFA. Recommend enabling MFA for all users."
            else:
                answer = "MFA is enabled for all users. Good compliance."

        elif "public" in question_lower or "s3" in question_lower or "bucket" in question_lower:
            buckets = [c for c in configs if "BUCKET" in str(c.get("violation_type", "")).upper()]
            if buckets:
                answer = f"{len(buckets)} public S3 buckets detected: "
                answer += ", ".join([b["resource_id"] for b in buckets])
                answer += ". These pose data exposure risk and should be secured immediately."
            else:
                answer = "No public S3 buckets detected."

        elif "approval" in question_lower or "unauthorized" in question_lower:
            unauthorized = [f for f in findings if f.get("finding_type") == "CHANGE"]
            if unauthorized:
                answer = f"{len(unauthorized)} unauthorized changes detected. "
                answer += "Change management controls need strengthening."
            else:
                answer = "No unauthorized changes detected."

        elif "summary" in question_lower or "overview" in question_lower or "what" in question_lower:
            answer = f"""ITGC Summary:
- Audit Readiness: {summary.get('audit_readiness', 'N/A')}%
- Open Findings: {summary.get('total_open', 0)}
- Critical Issues: {summary.get('critical', 0)}
- High Issues: {summary.get('high', 0)}
- Total Users: {summary.get('total_users', 0)}
- MFA Disabled Users: {summary.get('mfa_disabled', 0)}
- Dormant Admins: {summary.get('dormant_admins', 0)}"""

        else:
            answer = f"""I understand you're asking about: "{question}"

Based on the current ITGC monitoring data:
- Audit Readiness: {summary.get('audit_readiness', 'N/A')}%
- There are {summary.get('total_open', 0)} open findings ({summary.get('critical', 0)} critical, {summary.get('high', 0)} high)
- {summary.get('total_users', 0)} users are being monitored
- {summary.get('mfa_disabled', 0)} users have MFA disabled

You can ask me about: audit readiness, dormant accounts, SOX findings, MFA status, public buckets, unauthorized changes, or request a full summary."""

        return {
            "question": question,
            "answer": answer.strip(),
            "context_used": bool(context),
            "source": source
        }