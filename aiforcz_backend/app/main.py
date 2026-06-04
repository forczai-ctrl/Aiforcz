"""
AIForcz - Continuous ITGC Monitoring Platform
FastAPI Backend Application
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import case
from dotenv import load_dotenv

from .database import engine, get_db, Base
from .models import IAMUser, IAMGroup, CloudTrailEvent, ConfigChange, ITGCFinding, ChangeRequest, CopilotConversation
from .rule_engine import ITGCRuleEngine
from .ai_engine import AIRiskEngine
from .seed_data import seed_database
from .copilot_engine import AuditCopilot
from .report_generator import generate_auditor_report

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIForcz - ITGC Monitoring Platform",
    description="Continuous ITGC Monitoring Platform with AI-powered risk assessment",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
rule_engine = ITGCRuleEngine()
ai_engine = AIRiskEngine()


@app.get("/")
def root():
    """Return basic API navigation for browser visits to the backend root."""
    return {
        "name": "AIForcz - ITGC Monitoring Platform",
        "status": "running",
        "frontend": "http://localhost:3000",
        "health": "/api/health",
        "docs": "/docs"
    }


# === Health & System Endpoints ===

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "ai_enabled": ai_engine.use_llm
    }


@app.post("/api/seed-data")
def seed_data():
    """Seed database with mock ITGC data"""
    try:
        seed_database()
        return {"message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/run-rules")
def run_rules(db: Session = Depends(get_db)):
    """Execute all ITGC rules against current data"""
    try:
        users = db.query(IAMUser).all()
        events = db.query(CloudTrailEvent).all()
        configs = db.query(ConfigChange).all()

        findings = []
        
        # Run access control rules
        access_findings = rule_engine.evaluate_access_controls(users)
        findings.extend(access_findings)
        
        # Run change management rules
        change_findings = rule_engine.evaluate_change_management(events)
        findings.extend(change_findings)
        
        # Run configuration control rules
        config_findings = rule_engine.evaluate_configuration_controls(configs)
        findings.extend(config_findings)

        # Save findings to database
        saved_count = 0
        for finding_data in findings:
            existing = db.query(ITGCFinding).filter(
                ITGCFinding.rule_id == finding_data["rule_id"],
                ITGCFinding.resource_name == finding_data["resource_name"],
                ITGCFinding.status == "OPEN"
            ).first()
            
            if not existing:
                # Run AI analysis
                ai_analysis = ai_engine.analyze_finding(finding_data)
                finding_data["ai_risk_analysis"] = ai_analysis
                
                finding = ITGCFinding(**finding_data)
                db.add(finding)
                saved_count += 1
        
        db.commit()
        
        return {
            "message": f"Rules executed. {saved_count} new findings created.",
            "total_findings": len(findings),
            "new_findings": saved_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# === Dashboard Endpoints ===

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get executive dashboard summary metrics"""
    total_findings = db.query(ITGCFinding).count()
    open_findings = db.query(ITGCFinding).filter(ITGCFinding.status == "OPEN").count()
    critical = db.query(ITGCFinding).filter(
        ITGCFinding.severity == "CRITICAL",
        ITGCFinding.status == "OPEN"
    ).count()
    high = db.query(ITGCFinding).filter(
        ITGCFinding.severity == "HIGH",
        ITGCFinding.status == "OPEN"
    ).count()
    medium = db.query(ITGCFinding).filter(
        ITGCFinding.severity == "MEDIUM",
        ITGCFinding.status == "OPEN"
    ).count()
    low = db.query(ITGCFinding).filter(
        ITGCFinding.severity == "LOW",
        ITGCFinding.status == "OPEN"
    ).count()
    
    total_users = db.query(IAMUser).count()
    privileged_users = db.query(IAMUser).filter(IAMUser.is_privileged == True).count()
    inactive_users = db.query(ITGCFinding).filter(
        ITGCFinding.rule_id == "ITGC-01",
        ITGCFinding.status == "OPEN"
    ).count()
    dormant_admins = db.query(ITGCFinding).filter(
        ITGCFinding.rule_id == "ITGC-05",
        ITGCFinding.status == "OPEN"
    ).count()
    sod_violations = db.query(ITGCFinding).filter(
        ITGCFinding.rule_id == "ITGC-02",
        ITGCFinding.status == "OPEN"
    ).count()
    
    # Audit readiness calculation
    audit_readiness = max(0, 100 - (critical * 15 + high * 5 + open_findings * 2))
    audit_readiness = min(100, audit_readiness)
    
    return {
        "totalControls": total_findings or 125,
        "openIssues": open_findings,
        "highRisk": high,
        "critical": critical,
        "medium": medium,
        "low": low,
        "auditReadiness": audit_readiness,
        "usersReviewed": total_users,
        "privilegedAccounts": privileged_users,
        "inactiveUsers": inactive_users,
        "dormantAccounts": dormant_admins,
        "sodViolations": sod_violations
    }


@app.get("/api/dashboard/trends")
def get_risk_trend(db: Session = Depends(get_db)):
    """Get risk trend data for charts"""
    now = datetime.utcnow()
    trends = []
    
    for weeks_ago in range(12, -1, -1):
        week_start = now - timedelta(weeks=weeks_ago, days=7)
        week_end = now - timedelta(weeks=weeks_ago)
        
        week_critical = db.query(ITGCFinding).filter(
            ITGCFinding.severity == "CRITICAL",
            ITGCFinding.status == "OPEN",
            ITGCFinding.detected_at >= week_start,
            ITGCFinding.detected_at < week_end
        ).count()
        
        week_high = db.query(ITGCFinding).filter(
            ITGCFinding.severity == "HIGH",
            ITGCFinding.status == "OPEN",
            ITGCFinding.detected_at >= week_start,
            ITGCFinding.detected_at < week_end
        ).count()
        
        week_medium = db.query(ITGCFinding).filter(
            ITGCFinding.severity == "MEDIUM",
            ITGCFinding.status == "OPEN",
            ITGCFinding.detected_at >= week_start,
            ITGCFinding.detected_at < week_end
        ).count()
        
        trends.append({
            "week": f"Week {12 - weeks_ago}",
            "critical": week_critical,
            "high": week_high,
            "medium": week_medium
        })
    
    return trends


@app.get("/api/dashboard/findings-by-control")
def get_findings_by_control(db: Session = Depends(get_db)):
    """Get findings grouped by control category"""
    access_count = db.query(ITGCFinding).filter(
        ITGCFinding.finding_type == "ACCESS",
        ITGCFinding.status == "OPEN"
    ).count()
    
    change_count = db.query(ITGCFinding).filter(
        ITGCFinding.finding_type == "CHANGE",
        ITGCFinding.status == "OPEN"
    ).count()
    
    config_count = db.query(ITGCFinding).filter(
        ITGCFinding.finding_type == "CONFIG",
        ITGCFinding.status == "OPEN"
    ).count()
    
    return [
        {"name": "Access Controls", "value": access_count, "color": "#f44336"},
        {"name": "Change Management", "value": change_count, "color": "#ff9800"},
        {"name": "Config Controls", "value": config_count, "color": "#2196f3"}
    ]


@app.get("/api/dashboard/change-compliance")
def get_change_compliance(db: Session = Depends(get_db)):
    """Get change management compliance metrics"""
    total_changes = db.query(CloudTrailEvent).count()
    approved = db.query(CloudTrailEvent).filter(
        CloudTrailEvent.has_approval == True
    ).count()
    unauthorized = db.query(CloudTrailEvent).filter(
        CloudTrailEvent.is_unauthorized == True
    ).count()
    emergency = db.query(CloudTrailEvent).filter(
        CloudTrailEvent.is_emergency == True
    ).count()
    
    return {
        "totalChanges": total_changes,
        "approved": approved,
        "unauthorized": unauthorized,
        "emergency": emergency
    }


@app.get("/api/dashboard/user-access-risk")
def get_user_access_risk(db: Session = Depends(get_db)):
    """Get user access risk distribution"""
    mfa_disabled = db.query(IAMUser).filter(IAMUser.mfa_enabled == False).count()
    shared_accounts = db.query(IAMUser).filter(IAMUser.is_shared_account == True).count()
    no_manager = db.query(IAMUser).filter(IAMUser.manager == None).count()
    
    return {
        "mfaDisabled": mfa_disabled,
        "sharedAccounts": shared_accounts,
        "noManagerApproval": no_manager
    }


# === IAM User Endpoints ===

@app.get("/api/iam/users")
def get_iam_users(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get all IAM users"""
    users = db.query(IAMUser).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "department": u.department,
            "manager": u.manager,
            "mfaEnabled": u.mfa_enabled,
            "lastLogin": u.last_login.isoformat() if u.last_login else None,
            "createdDate": u.created_date.isoformat() if u.created_date else None,
            "isActive": u.is_active,
            "isPrivileged": u.is_privileged,
            "accessKeysCount": u.access_keys_count,
            "loginCount": u.login_count,
            "isSharedAccount": u.is_shared_account
        }
        for u in users
    ]


@app.get("/api/iam/users/summary")
def get_iam_summary(db: Session = Depends(get_db)):
    """Get IAM user summary statistics"""
    total = db.query(IAMUser).count()
    active = db.query(IAMUser).filter(IAMUser.is_active == True).count()
    privileged = db.query(IAMUser).filter(IAMUser.is_privileged == True).count()
    mfa_enabled = db.query(IAMUser).filter(IAMUser.mfa_enabled == True).count()
    inactive_90 = db.query(IAMUser).filter(
        IAMUser.last_login != None,
        IAMUser.last_login < datetime.utcnow() - timedelta(days=90)
    ).count()
    shared = db.query(IAMUser).filter(IAMUser.is_shared_account == True).count()
    
    return {
        "totalUsers": total,
        "activeUsers": active,
        "privilegedUsers": privileged,
        "mfaEnabled": mfa_enabled,
        "mfaDisabled": total - mfa_enabled,
        "inactiveUsers": inactive_90,
        "sharedAccounts": shared
    }


# === CloudTrail Events Endpoints ===

@app.get("/api/cloudtrail/events")
def get_cloudtrail_events(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get CloudTrail events"""
    events = db.query(CloudTrailEvent).order_by(
        CloudTrailEvent.event_time.desc()
    ).offset(skip).limit(limit).all()
    return [
        {
            "id": e.id,
            "event_id": e.event_id,
            "event_name": e.event_name,
            "event_time": e.event_time.isoformat() if e.event_time else None,
            "username": e.username,
            "resource_type": e.resource_type,
            "is_unauthorized": e.is_unauthorized,
            "has_approval": e.has_approval,
            "is_emergency": e.is_emergency,
            "ticket_number": e.ticket_number
        }
        for e in events
    ]


# === Config Changes Endpoints ===

@app.get("/api/config/changes")
def get_config_changes(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get configuration changes"""
    configs = db.query(ConfigChange).order_by(
        ConfigChange.changed_at.desc()
    ).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id,
            "resource_id": c.resource_id,
            "resource_type": c.resource_type,
            "change_type": c.change_type,
            "changed_by": c.changed_by,
            "changed_at": c.changed_at.isoformat() if c.changed_at else None,
            "is_approved": c.is_approved,
            "has_ticket": c.has_ticket,
            "violation_type": c.violation_type,
            "severity": c.severity
        }
        for c in configs
    ]


@app.get("/api/config/summary")
def get_config_summary(db: Session = Depends(get_db)):
    """Get configuration changes summary"""
    total = db.query(ConfigChange).count()
    unauthorized = db.query(ConfigChange).filter(ConfigChange.is_approved == False).count()
    public_buckets = db.query(ConfigChange).filter(
        ConfigChange.violation_type == "PUBLIC_BUCKET_ACL"
    ).count()
    open_sgs = db.query(ConfigChange).filter(
        ConfigChange.violation_type == "SG_OPEN_TO_INTERNET"
    ).count()
    
    return {
        "totalChanges": total,
        "unauthorized": unauthorized,
        "publicBuckets": public_buckets,
        "openSecurityGroups": open_sgs,
        "policyViolations": unauthorized
    }


# === ITGC Findings Endpoints ===

@app.get("/api/findings")
def get_findings(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    finding_type: Optional[str] = None
):
    """Get ITGC findings with optional filters"""
    query = db.query(ITGCFinding).order_by(
        case(
            (ITGCFinding.severity == "CRITICAL", 0),
            (ITGCFinding.severity == "HIGH", 1),
            (ITGCFinding.severity == "MEDIUM", 2),
            else_=3
        ),
        ITGCFinding.detected_at.desc()
    )
    
    if severity:
        query = query.filter(ITGCFinding.severity == severity.upper())
    if status:
        query = query.filter(ITGCFinding.status == status.upper())
    if finding_type:
        query = query.filter(ITGCFinding.finding_type == finding_type.upper())
    
    findings = query.offset(skip).limit(limit).all()
    return [
        {
            "id": f.id,
            "finding_type": f.finding_type,
            "rule_id": f.rule_id,
            "rule_name": f.rule_name,
            "description": f.description,
            "severity": f.severity,
            "status": f.status,
            "source": f.source,
            "resource_name": f.resource_name,
            "username": f.username,
            "detected_at": f.detected_at.isoformat() if f.detected_at else None,
            "control_id": f.control_id,
            "control_name": f.control_name,
            "sop_reference": f.sop_reference,
            "ai_risk_analysis": f.ai_risk_analysis
        }
        for f in findings
    ]


@app.get("/api/findings/{finding_id}")
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    """Get detailed ITGC finding with AI analysis"""
    finding = db.query(ITGCFinding).filter(ITGCFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    return {
        "id": finding.id,
        "finding_type": finding.finding_type,
        "rule_id": finding.rule_id,
        "rule_name": finding.rule_name,
        "description": finding.description,
        "severity": finding.severity,
        "status": finding.status,
        "source": finding.source,
        "resource_name": finding.resource_name,
        "username": finding.username,
        "detected_at": finding.detected_at.isoformat() if finding.detected_at else None,
        "control_id": finding.control_id,
        "control_name": finding.control_name,
        "sop_reference": finding.sop_reference,
        "ai_risk_analysis": finding.ai_risk_analysis or {}
    }


@app.patch("/api/findings/{finding_id}/status")
def update_finding_status(finding_id: int, status: str, db: Session = Depends(get_db)):
    """Update ITGC finding status"""
    finding = db.query(ITGCFinding).filter(ITGCFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"]
    if status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    finding.status = status.upper()
    if status.upper() == "RESOLVED":
        finding.remediated_at = datetime.utcnow()
    
    db.commit()
    return {"message": f"Finding {finding_id} status updated to {status}"}


# === AI Insights Endpoints ===

@app.post("/api/ai/analyze/{finding_id}")
def analyze_finding(finding_id: int, db: Session = Depends(get_db)):
    """Run AI analysis on a specific finding"""
    finding = db.query(ITGCFinding).filter(ITGCFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    finding_data = {
        "rule_id": finding.rule_id,
        "rule_name": finding.rule_name,
        "description": finding.description,
        "severity": finding.severity,
        "control_id": finding.control_id,
        "control_name": finding.control_name,
        "resource_name": finding.resource_name,
        "username": finding.username,
        "source": finding.source
    }
    
    analysis = ai_engine.analyze_finding(finding_data)
    finding.ai_risk_analysis = analysis
    db.commit()
    
    return analysis


@app.get("/api/ai/audit-prediction")
def get_audit_prediction(db: Session = Depends(get_db)):
    """Get AI-powered audit prediction"""
    findings = db.query(ITGCFinding).filter(ITGCFinding.status == "OPEN").all()
    findings_data = [
        {
            "rule_id": f.rule_id,
            "rule_name": f.rule_name,
            "description": f.description,
            "severity": f.severity,
            "status": f.status
        }
        for f in findings
    ]
    
    prediction = ai_engine.predict_audit_findings(findings_data)
    return prediction


@app.get("/api/ai/remediation-plan")
def get_remediation_plan(db: Session = Depends(get_db)):
    """Get AI-generated remediation plan"""
    findings = db.query(ITGCFinding).filter(ITGCFinding.status == "OPEN").all()
    findings_data = [
        {
            "rule_id": f.rule_id,
            "rule_name": f.rule_name,
            "description": f.description,
            "severity": f.severity,
            "status": f.status
        }
        for f in findings
    ]
    
    plan = ai_engine.generate_remediation_plan(findings_data)
    return plan


# === ITGC Rules Endpoints ===

@app.get("/api/rules")
def get_itgc_rules():
    """Get all ITGC rules"""
    rules = []
    for rule_id, rule in ITGCRuleEngine.RULES.items():
        rules.append({
            "rule_id": rule_id,
            "name": rule["name"],
            "control_id": rule["control_id"],
            "control_name": rule["control_name"],
            "category": rule["category"],
            "description": rule["description"],
            "severity": rule["severity"],
            "sop": rule["sop"]
        })
    return rules


# === Audit Copilot Endpoints ===

copilot = AuditCopilot()


@app.post("/api/copilot/ask", response_model=None)
def ask_copilot(question: str, db: Session = Depends(get_db)):
    """Ask the Audit Copilot a question about ITGC compliance"""
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    copilot.set_db(db)
    response = copilot.answer_question(question.strip())

    # Save conversation
    conversation = CopilotConversation(
        question=question.strip(),
        answer=response.get("answer", ""),
        context={"source": response.get("source", "rule-based")}
    )
    db.add(conversation)
    db.commit()

    return response


@app.get("/api/copilot/history")
def get_copilot_history(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get copilot conversation history"""
    conversations = db.query(CopilotConversation).order_by(
        CopilotConversation.created_at.desc()
    ).offset(skip).limit(limit).all()

    return [
        {
            "id": c.id,
            "question": c.question,
            "answer": c.answer,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in conversations
    ]


# === IAM Groups Endpoints ===

@app.get("/api/iam/groups")
def get_iam_groups(db: Session = Depends(get_db)):
    """Get all IAM groups"""
    groups = db.query(IAMGroup).all()
    return [
        {
            "id": g.id,
            "group_name": g.group_name,
            "description": g.description,
            "policy_count": g.policy_count,
            "user_count": g.user_count,
            "created_at": g.created_at.isoformat() if g.created_at else None,
        }
        for g in groups
    ]


# === Change Request Endpoints ===

@app.get("/api/change-requests")
def get_change_requests(db: Session = Depends(get_db)):
    """Get all change requests from CSV data"""
    requests = db.query(ChangeRequest).all()
    return [
        {
            "id": r.id,
            "change_id": r.change_id,
            "approved": r.approved,
            "emergency": r.emergency,
            "implemented_by": r.implemented_by,
            "ticket_number": r.ticket_number,
            "description": r.description,
            "detected_at": r.detected_at.isoformat() if r.detected_at else None,
        }
        for r in requests
    ]


@app.get("/api/change-requests/compliance")
def get_change_request_compliance(db: Session = Depends(get_db)):
    """Get change request compliance metrics"""
    total = db.query(ChangeRequest).count()
    approved = db.query(ChangeRequest).filter(ChangeRequest.approved == True).count()
    unauthorized = db.query(ChangeRequest).filter(ChangeRequest.approved == False).count()
    emergency = db.query(ChangeRequest).filter(ChangeRequest.emergency == True).count()
    no_ticket = db.query(ChangeRequest).filter(ChangeRequest.ticket_number == None).count()

    return {
        "totalChanges": total,
        "approved": approved,
        "unauthorized": unauthorized,
        "emergency": emergency,
        "noTicket": no_ticket,
        "complianceRate": round((approved / total * 100) if total > 0 else 0, 1)
    }


# === PDF Report Endpoint ===

@app.get("/api/report/pdf")
def generate_pdf_report(db: Session = Depends(get_db)):
    """Generate and download auditor PDF report"""
    try:
        # Gather all data for the report
        users_data = db.query(IAMUser).all()
        findings_data = db.query(ITGCFinding).order_by(
            case(
                (ITGCFinding.severity == "CRITICAL", 0),
                (ITGCFinding.severity == "HIGH", 1),
                (ITGCFinding.severity == "MEDIUM", 2),
                else_=3
            )
        ).all()
        events_data = db.query(CloudTrailEvent).all()
        configs_data = db.query(ConfigChange).all()

        open_findings = [f for f in findings_data if f.status == "OPEN"]
        critical_count = len([f for f in open_findings if f.severity == "CRITICAL"])
        high_count = len([f for f in open_findings if f.severity == "HIGH"])
        audit_readiness = max(0, min(100, 100 - (critical_count * 15 + high_count * 5 + len(open_findings) * 2)))

        # Get audit prediction
        prediction_data = [
            {
                "rule_id": f.rule_id, "rule_name": f.rule_name,
                "description": f.description, "severity": f.severity, "status": f.status
            }
            for f in open_findings
        ]
        audit_prediction = ai_engine.predict_audit_findings(prediction_data)

        # Build report data
        summary = {
            "auditReadiness": audit_readiness,
            "openIssues": len(open_findings),
            "highRisk": high_count,
            "critical": critical_count,
            "usersReviewed": len(users_data),
            "privilegedAccounts": len([u for u in users_data if u.is_privileged]),
            "totalControls": len(findings_data),
        }

        report_data = {
            "summary": summary,
            "users": [
                {
                    "username": u.username, "mfaEnabled": u.mfa_enabled,
                    "isPrivileged": u.is_privileged, "isActive": u.is_active,
                    "role": u.role, "department": u.department,
                    "lastLogin": u.last_login.isoformat() if u.last_login else None,
                }
                for u in users_data
            ],
            "findings": [
                {
                    "finding_type": f.finding_type, "rule_id": f.rule_id,
                    "rule_name": f.rule_name, "description": f.description,
                    "severity": f.severity, "status": f.status,
                    "source": f.source, "username": f.username,
                    "control_id": f.control_id, "control_name": f.control_name,
                    "ai_risk_analysis": f.ai_risk_analysis,
                }
                for f in findings_data
            ],
            "events": [
                {
                    "event_name": e.event_name, "username": e.username,
                    "is_unauthorized": e.is_unauthorized, "is_emergency": e.is_emergency,
                    "has_approval": e.has_approval, "ticket_number": e.ticket_number,
                }
                for e in events_data
            ],
            "configs": [
                {
                    "resource_id": c.resource_id, "resource_type": c.resource_type,
                    "change_type": c.change_type, "violation_type": c.violation_type,
                    "is_approved": c.is_approved, "changed_by": c.changed_by,
                }
                for c in configs_data
            ],
            "auditPrediction": audit_prediction,
        }

        # Generate PDF
        pdf_bytes = generate_auditor_report(report_data)

        # Return PDF as download
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=itgc-audit-report-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")


# === Scanner Endpoints ===

from .scanners.iam_scanner import IAMScanner
from .scanners.cloudtrail_scanner import CloudTrailAnalyzer
from .scanners.config_scanner import ConfigMonitor


@app.get("/api/scanners/iam")
def scan_iam_users(db: Session = Depends(get_db)):
    """Run IAM scanner and return risks"""
    users = db.query(IAMUser).all()
    scanned = IAMScanner.scan_users(users)
    risks = IAMScanner.identify_risks(scanned)
    return {
        "total_users": len(scanned),
        "risks_found": len(risks),
        "risks": risks
    }


@app.get("/api/scanners/cloudtrail")
def scan_cloudtrail_events(db: Session = Depends(get_db)):
    """Run CloudTrail scanner and return findings"""
    events = db.query(CloudTrailEvent).all()
    findings = CloudTrailAnalyzer.analyze_events(events)
    root_activity = CloudTrailAnalyzer.detect_root_activity(events)
    return {
        "total_events": len(events),
        "findings": findings,
        "root_activity": root_activity
    }


@app.get("/api/scanners/config")
def scan_config_changes(db: Session = Depends(get_db)):
    """Run Config scanner and return violations"""
    configs = db.query(ConfigChange).all()
    results = ConfigMonitor.run_all_checks(configs)
    violations = sum(len(v) for v in results.values())
    return {
        "total_configs": len(configs),
        "violations_found": violations,
        **results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
