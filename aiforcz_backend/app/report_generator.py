"""
Auditor Report Generator - Generates PDF reports for ITGC audit
Sections: Executive Summary, Access Controls, Change Management, 
Configuration Controls, AI Recommendations, Evidence
"""
import os
import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem
)
from reportlab.platypus.flowables import HRFlowable


class AuditorReportGenerator:
    """Generate ITGC Auditor PDF Reports"""

    COLORS = {
        'primary': HexColor('#1a1a2e'),
        'secondary': HexColor('#7c4dff'),
        'critical': HexColor('#f44336'),
        'high': HexColor('#ff9800'),
        'medium': HexColor('#2196f3'),
        'low': HexColor('#4caf50'),
        'success': HexColor('#00e676'),
        'bg_light': HexColor('#f5f5f5'),
    }

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        """Setup custom report styles"""
        self.styles.add(ParagraphStyle(
            'CoverTitle', parent=self.styles['Title'],
            fontSize=28, textColor=self.COLORS['primary'],
            spaceAfter=12, alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            'CoverSubtitle', parent=self.styles['Normal'],
            fontSize=14, textColor=HexColor('#666666'),
            spaceAfter=6, alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            'SectionTitle', parent=self.styles['Heading1'],
            fontSize=18, textColor=self.COLORS['secondary'],
            spaceBefore=20, spaceAfter=12,
            borderWidth=0, borderColor=self.COLORS['secondary'],
            borderPadding=4,
        ))
        self.styles.add(ParagraphStyle(
            'SectionSubtitle', parent=self.styles['Heading2'],
            fontSize=14, textColor=self.COLORS['primary'],
            spaceBefore=12, spaceAfter=8
        ))
        self.styles.add(ParagraphStyle(
            'FindingText', parent=self.styles['Normal'],
            fontSize=10, leading=14,
            spaceBefore=4, spaceAfter=4
        ))
        self.styles.add(ParagraphStyle(
            'RiskTag', parent=self.styles['Normal'],
            fontSize=8, textColor=white,
            backColor=self.COLORS['critical'],
            spaceBefore=2, spaceAfter=2
        ))
        self.styles.add(ParagraphStyle(
            'Footer', parent=self.styles['Normal'],
            fontSize=8, textColor=HexColor('#999999'),
            alignment=TA_CENTER
        ))

    def generate_report(self, data: Dict[str, Any]) -> bytes:
        """
        Generate the full auditor PDF report.
        data should contain: summary, users, findings, events, configs, ai_insights
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            topMargin=0.75*inch, bottomMargin=0.75*inch,
            leftMargin=0.75*inch, rightMargin=0.75*inch
        )

        story = []
        self._add_cover_page(story, data)
        story.append(PageBreak())

        self._add_executive_summary(story, data)
        story.append(PageBreak())

        self._add_access_controls_section(story, data)
        story.append(PageBreak())

        self._add_change_management_section(story, data)
        story.append(PageBreak())

        self._add_config_controls_section(story, data)
        story.append(PageBreak())

        self._add_ai_recommendations(story, data)

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def _add_cover_page(self, story, data: Dict[str, Any]):
        """Add cover page"""
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("ITGC Audit Readiness Report", self.styles['CoverTitle']))
        story.append(Spacer(1, 0.3*inch))
        story.append(HRFlowable(width="60%", thickness=2, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("Continuous ITGC Monitoring Platform", self.styles['CoverSubtitle']))
        story.append(Paragraph("AI-Powered Compliance Assessment", self.styles['CoverSubtitle']))
        story.append(Spacer(1, 0.5*inch))

        summary = data.get('summary', {})
        score = summary.get('auditReadiness', 0)
        score_color = self.COLORS['critical'] if score < 60 else (self.COLORS['high'] if score < 80 else self.COLORS['success'])

        score_data = [[
            Paragraph(f"<font size='48' color='{score_color.hexval()}'><b>{score}%</b></font>", self.styles['Normal']),
            Paragraph("Audit Readiness Score", self.styles['CoverSubtitle'])
        ]]
        score_table = Table(score_data, colWidths=[2*inch, 4*inch])
        score_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(score_table)

        story.append(Spacer(1, 0.5*inch))
        story.append(HRFlowable(width="60%", thickness=1, color=HexColor('#cccccc')))
        story.append(Spacer(1, 0.3*inch))

        # Date and info
        date_info = [
            f"Report Generated: {datetime.utcnow().strftime('%B %d, %Y')}",
            f"Period: Last 90 days",
            f"Users Reviewed: {summary.get('usersReviewed', 0)}",
            f"Privileged Accounts: {summary.get('privilegedAccounts', 0)}",
        ]
        for line in date_info:
            story.append(Paragraph(line, self.styles['CoverSubtitle']))

    def _add_executive_summary(self, story, data: Dict[str, Any]):
        """Add executive summary section"""
        story.append(Paragraph("1. Executive Summary", self.styles['SectionTitle']))
        story.append(HRFlowable(width="100%", thickness=1, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.2*inch))

        summary = data.get('summary', {})

        # Key metrics table
        metrics = [
            ["Metric", "Value", "Status"],
            ["Audit Readiness", f"{summary.get('auditReadiness', 0)}%",
             "At Risk" if summary.get('auditReadiness', 100) < 70 else "Moderate" if summary.get('auditReadiness', 100) < 85 else "Good"],
            ["Critical Findings", str(summary.get('critical', 0)),
             "Critical" if summary.get('critical', 0) > 0 else "Good"],
            ["High Risk Findings", str(summary.get('highRisk', 0)),
             "High" if summary.get('highRisk', 0) > 2 else "Moderate"],
            ["Open Issues", str(summary.get('openIssues', 0)),
             "Needs Attention" if summary.get('openIssues', 0) > 5 else "Manageable"],
            ["Users Reviewed", str(summary.get('usersReviewed', 0)), "N/A"],
        ]

        metrics_table = Table(metrics, colWidths=[2.5*inch, 1.5*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f8ff')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(metrics_table)

        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph(
            "<b>Assessment:</b> This report summarizes the current IT General Controls (ITGC) compliance "
            "posture based on continuous monitoring of AWS infrastructure. The findings are categorized "
            "by severity and control domain for prioritized remediation.",
            self.styles['FindingText']
        ))

    def _add_access_controls_section(self, story, data: Dict[str, Any]):
        """Add access controls findings section"""
        story.append(Paragraph("2. Access Controls Assessment", self.styles['SectionTitle']))
        story.append(HRFlowable(width="100%", thickness=1, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.2*inch))

        users = data.get('users', [])
        findings = data.get('findings', [])
        access_findings = [f for f in findings if f.get('finding_type') == 'ACCESS']

        # User summary
        mfa_disabled = len([u for u in users if not u.get('mfaEnabled', True)])
        privileged = len([u for u in users if u.get('isPrivileged')])
        inactive = len([u for u in users if not u.get('isActive', True)])

        user_stats = [
            ["Category", "Count"],
            ["Total Users", str(len(users))],
            ["Privileged Users", str(privileged)],
            ["MFA Disabled", str(mfa_disabled)],
            ["Inactive Users", str(inactive)],
        ]
        stat_table = Table(user_stats, colWidths=[3*inch, 3*inch])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f8ff')]),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(stat_table)
        story.append(Spacer(1, 0.2*inch))

        # Access findings
        if access_findings:
            story.append(Paragraph("<b>Access Control Findings:</b>", self.styles['SectionSubtitle']))
            for f in access_findings[:10]:
                severity = f.get('severity', 'MEDIUM')
                color = self.COLORS.get(severity.lower(), self.COLORS['medium'])
                story.append(Paragraph(
                    f"<font color='{color.hexval()}'><b>[{severity}]</b></font> "
                    f"<b>{f.get('rule_name', 'Finding')}</b><br/>"
                    f"{f.get('description', '')}<br/>"
                    f"<font size='8' color='#666666'>User: {f.get('username', 'N/A')} | "
                    f"Control: {f.get('control_id', 'N/A')}</font>",
                    self.styles['FindingText']
                ))
                story.append(Spacer(1, 0.1*inch))

    def _add_change_management_section(self, story, data: Dict[str, Any]):
        """Add change management findings section"""
        story.append(Paragraph("3. Change Management Assessment", self.styles['SectionTitle']))
        story.append(HRFlowable(width="100%", thickness=1, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.2*inch))

        events = data.get('events', [])
        findings = data.get('findings', [])
        change_findings = [f for f in findings if f.get('finding_type') == 'CHANGE']

        unauthorized = len([e for e in events if e.get('is_unauthorized')])
        emergency = len([e for e in events if e.get('is_emergency')])
        total = len(events)

        change_stats = [
            ["Category", "Count"],
            ["Total Changes Tracked", str(total)],
            ["Unauthorized Changes", str(unauthorized)],
            ["Emergency Changes", str(emergency)],
            ["Changes Without Tickets", str(len([e for e in events if not e.get('ticket_number')]))],
        ]
        stat_table = Table(change_stats, colWidths=[3*inch, 3*inch])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f8ff')]),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(stat_table)
        story.append(Spacer(1, 0.2*inch))

        if change_findings:
            story.append(Paragraph("<b>Change Management Findings:</b>", self.styles['SectionSubtitle']))
            for f in change_findings[:10]:
                severity = f.get('severity', 'MEDIUM')
                color = self.COLORS.get(severity.lower(), self.COLORS['medium'])
                story.append(Paragraph(
                    f"<font color='{color.hexval()}'><b>[{severity}]</b></font> "
                    f"<b>{f.get('rule_name', 'Finding')}</b><br/>"
                    f"{f.get('description', '')}",
                    self.styles['FindingText']
                ))
                story.append(Spacer(1, 0.1*inch))

    def _add_config_controls_section(self, story, data: Dict[str, Any]):
        """Add configuration controls section"""
        story.append(Paragraph("4. Configuration Controls Assessment", self.styles['SectionTitle']))
        story.append(HRFlowable(width="100%", thickness=1, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.2*inch))

        configs = data.get('configs', [])
        findings = data.get('findings', [])
        config_findings = [f for f in findings if f.get('finding_type') == 'CONFIG']

        public_buckets = len([c for c in configs if 'BUCKET' in str(c.get('violation_type', '')).upper()])
        open_sgs = len([c for c in configs if 'SG_' in str(c.get('violation_type', '')).upper()])
        policy_violations = len([c for c in configs if 'POLICY' in str(c.get('violation_type', '')).upper()])

        config_stats = [
            ["Category", "Count"],
            ["Public S3 Buckets", str(public_buckets)],
            ["Open Security Groups", str(open_sgs)],
            ["Policy Violations", str(policy_violations)],
        ]
        stat_table = Table(config_stats, colWidths=[3*inch, 3*inch])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f8ff')]),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(stat_table)
        story.append(Spacer(1, 0.2*inch))

        if config_findings:
            story.append(Paragraph("<b>Configuration Findings:</b>", self.styles['SectionSubtitle']))
            for f in config_findings[:10]:
                severity = f.get('severity', 'MEDIUM')
                color = self.COLORS.get(severity.lower(), self.COLORS['medium'])
                story.append(Paragraph(
                    f"<font color='{color.hexval()}'><b>[{severity}]</b></font> "
                    f"<b>{f.get('rule_name', 'Finding')}</b><br/>"
                    f"{f.get('description', '')}",
                    self.styles['FindingText']
                ))
                story.append(Spacer(1, 0.1*inch))

    def _add_ai_recommendations(self, story, data: Dict[str, Any]):
        """Add AI recommendations section"""
        story.append(Paragraph("5. AI-Powered Recommendations", self.styles['SectionTitle']))
        story.append(HRFlowable(width="100%", thickness=1, color=self.COLORS['secondary']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(
            "The following recommendations are generated by AI analysis of the ITGC findings. "
            "These are prioritized by risk severity and business impact.",
            self.styles['FindingText']
        ))
        story.append(Spacer(1, 0.2*inch))

        findings = data.get('findings', [])
        ai_insights = data.get('aiInsights', {})

        # Get top recommendations
        if findings:
            story.append(Paragraph("<b>Prioritized Remediation Actions:</b>", self.styles['SectionSubtitle']))
            for i, f in enumerate(sorted(findings, key=lambda x: 
                ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].index(x.get('severity', 'LOW')))[:5], 1):
                ai = f.get('ai_risk_analysis', {})
                if isinstance(ai, str):
                    try:
                        import json
                        ai = json.loads(ai)
                    except:
                        ai = {}
                story.append(Paragraph(
                    f"<b>{i}. {f.get('rule_name', 'Finding')}</b> "
                    f"<font color='{self.COLORS.get(f.get('severity', 'MEDIUM').lower(), self.COLORS['medium']).hexval()}'>"
                    f"[{f.get('severity', 'MEDIUM')}]</font><br/>"
                    f"<b>Recommendation:</b> {ai.get('recommendation', 'Review and remediate')}<br/>"
                    f"<b>Business Impact:</b> {ai.get('businessImpact', 'N/A')}<br/>"
                    f"<font size='8' color='#666666'>SOX Risk: {ai.get('soxRisk', 'N/A')} | "
                    f"Regulations: {', '.join(ai.get('regulatoryReferences', ['N/A']))}</font>",
                    self.styles['FindingText']
                ))
                story.append(Spacer(1, 0.15*inch))

        # Audit prediction
        prediction = data.get('auditPrediction', {})
        if prediction:
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("<b>Audit Prediction:</b>", self.styles['SectionSubtitle']))
            story.append(Paragraph(
                f"<b>Overall Risk:</b> {prediction.get('overallRisk', 'Medium')}<br/>"
                f"<b>Predicted Audit Findings:</b> {prediction.get('predictedFindings', 0)}<br/>"
                f"<b>Recommendation:</b> {prediction.get('recommendation', 'Continue monitoring')}",
                self.styles['FindingText']
            ))

        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#cccccc')))
        story.append(Paragraph(
            f"Report generated by AIForcz Continuous ITGC Monitoring Platform | "
            f"{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            self.styles['Footer']
        ))


def generate_auditor_report(data: Dict[str, Any]) -> bytes:
    """Convenience function to generate auditor PDF report"""
    generator = AuditorReportGenerator()
    return generator.generate_report(data)