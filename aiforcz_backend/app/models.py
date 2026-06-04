import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class IAMUser(Base):
    __tablename__ = "iam_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(200))
    role = Column(String(50))
    department = Column(String(100))
    manager = Column(String(100))
    mfa_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    is_privileged = Column(Boolean, default=False)
    access_keys_count = Column(Integer, default=0)
    login_count = Column(Integer, default=0)
    console_login_profiles = Column(Integer, default=1)
    is_shared_account = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class CloudTrailEvent(Base):
    __tablename__ = "cloudtrail_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(200), unique=True)
    event_name = Column(String(200))
    event_time = Column(DateTime)
    username = Column(String(200))
    resource_type = Column(String(100))
    resource_name = Column(String(200))
    source_ip = Column(String(50))
    user_agent = Column(Text)
    request_params = Column(JSON)
    is_unauthorized = Column(Boolean, default=False)
    has_approval = Column(Boolean, default=True)
    is_emergency = Column(Boolean, default=False)
    ticket_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ConfigChange(Base):
    __tablename__ = "config_changes"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(200))
    resource_type = Column(String(100))
    change_type = Column(String(100))
    change_detail = Column(JSON)
    changed_by = Column(String(100))
    changed_at = Column(DateTime)
    is_approved = Column(Boolean, default=True)
    has_ticket = Column(Boolean, default=True)
    ticket_number = Column(String(100), nullable=True)
    violation_type = Column(String(100), nullable=True)
    severity = Column(String(20), default="MEDIUM")
    created_at = Column(DateTime, server_default=func.now())


class IAMGroup(Base):
    __tablename__ = "iam_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), unique=True, index=True)
    description = Column(String(500))
    policy_count = Column(Integer, default=0)
    user_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True, index=True)
    change_id = Column(String(20), unique=True, index=True)
    approved = Column(Boolean, default=False)
    emergency = Column(Boolean, default=False)
    implemented_by = Column(String(100))
    ticket_number = Column(String(100), nullable=True)
    description = Column(Text)
    detected_at = Column(DateTime, server_default=func.now())


class CopilotConversation(Base):
    __tablename__ = "copilot_conversations"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    answer = Column(Text)
    context = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ITGCFinding(Base):
    __tablename__ = "itgc_findings"

    id = Column(Integer, primary_key=True, index=True)
    finding_type = Column(String(50))  # ACCESS, CHANGE, CONFIG
    rule_id = Column(String(20))
    rule_name = Column(String(200))
    description = Column(Text)
    severity = Column(String(20))  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(20), default="OPEN")  # OPEN, IN_PROGRESS, RESOLVED
    source = Column(String(100))
    resource_name = Column(String(200))
    username = Column(String(100), nullable=True)
    detected_at = Column(DateTime, server_default=func.now())
    ai_risk_analysis = Column(JSON, nullable=True)
    remediated_at = Column(DateTime, nullable=True)
    remediation_action = Column(Text, nullable=True)
    control_id = Column(String(50))
    control_name = Column(String(200))
    sop_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())