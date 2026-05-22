from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

OUTPUT = "/Users/justhamzaaa/Projects/pharmacy-one-stop/docs/P1S-Test-Logins.pdf"

doc = SimpleDocTemplate(OUTPUT, pagesize=A4, topMargin=25*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
styles = getSampleStyleSheet()

# Custom styles
TEAL = colors.HexColor("#0d9488")
DARK = colors.HexColor("#111827")
GRAY = colors.HexColor("#6b7280")
LIGHT_TEAL = colors.HexColor("#f0fdfa")

title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=22, textColor=TEAL, spaceAfter=4)
subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=10, textColor=GRAY, spaceAfter=12)
section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=13, textColor=DARK, spaceBefore=16, spaceAfter=6, borderPadding=(0, 0, 4, 0))
note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8.5, textColor=GRAY, spaceAfter=8)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5, textColor=DARK, leading=14)

def make_table(headers, rows, col_widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("LINEBELOW", (0, 0), (-1, 0), 1, TEAL),
        ("LINEBELOW", (0, 1), (-1, -2), 0.5, colors.HexColor("#e5e7eb")),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#d1d5db")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
    ]))
    return t

elements = []

# Header
elements.append(Paragraph("Pharmacy One Stop", title_style))
elements.append(Paragraph(f"Test Environment Login Credentials &mdash; Generated {datetime.now().strftime('%d %B %Y')}", subtitle_style))
elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))

# Platform URL
elements.append(Paragraph("<b>Platform URL:</b> http://63.181.137.168 &nbsp;&nbsp;|&nbsp;&nbsp; <b>API:</b> http://63.181.137.168:4000/api/health", body_style))
elements.append(Spacer(1, 4))
elements.append(Paragraph("<b>CONFIDENTIAL</b> &mdash; Do not share outside the testing team.", ParagraphStyle("Conf", parent=note_style, textColor=colors.HexColor("#dc2626"), fontSize=9, fontName="Helvetica-Bold")))

# 1. Platform Admin
elements.append(Paragraph("1. Platform Administration", section_style))
elements.append(make_table(
    ["Role", "Email", "Password", "Access"],
    [
        ["Super Admin", "admin@pharmacyonestop.co.uk", "SuperAdmin1!", "Full platform control"],
        ["Support Agent", "support@pharmacyonestop.co.uk", "Support1!", "Tenant support, impersonation"],
    ],
    col_widths=[80, 180, 90, 160],
))

# 2. Pharmacy Owners
elements.append(Paragraph("2. Pharmacy Owners", section_style))
elements.append(make_table(
    ["Pharmacy", "Email", "Password", "Tier"],
    [
        ["Wellness Pharmacy", "owner@wellnesspharmacy.co.uk", "Owner123!", "Professional"],
        ["MediCare Pharmacy", "owner@medicarepharmacy.co.uk", "Owner123!", "Professional"],
        ["QuickScript Pharmacy", "owner@quickscript.co.uk", "Owner123!", "Professional"],
        ["High Street Pharmacy", "amir@highstreetpharmacy.co.uk", "Owner123!", "Enterprise"],
        ["Greenfield Pharmacy", "yasmin@greenfieldpharmacy.co.uk", "Test1234!", "Professional"],
        ["City Health Pharmacy", "tom@cityhealthpharmacy.co.uk", "Test1234!", "Professional"],
        ["Rose Lane Pharmacy", "grace@roselanepharmacy.co.uk", "Test1234!", "Professional"],
        ["Noor Pharmacy", "bilal@noorpharmacy.co.uk", "Test1234!", "Professional"],
    ],
    col_widths=[110, 185, 75, 75],
))

# 3. Clinical Staff
elements.append(Paragraph("3. Clinical Staff", section_style))
elements.append(make_table(
    ["Role", "Email", "Password", "Pharmacy"],
    [
        ["Prescriber", "prescriber@quickscript.co.uk", "Pharma123!", "QuickScript Pharmacy"],
        ["Prescriber", "sarah.chen@highstreetpharmacy.co.uk", "Pharma123!", "High Street Pharmacy"],
        ["Pharmacist", "pharmacist@sunrisehealth.co.uk", "Owner123!", "Sunrise Health"],
    ],
    col_widths=[70, 200, 80, 140],
))

# 4. Patients
elements.append(Paragraph("4. Patient Accounts", section_style))
elements.append(Paragraph("All patient accounts use password: <b>Test1234!</b>", note_style))
elements.append(make_table(
    ["Name", "Email", "Location", "IDV Status"],
    [
        ["James Davies", "james.davies@email.com", "Manchester", "Passed"],
        ["Sophie Williams", "sophie.williams@email.com", "Birmingham", "Passed"],
        ["Mohammed Ali", "mohammed.ali@email.com", "Leeds", "Passed"],
        ["Emily Brown", "emily.brown@email.com", "Liverpool", "Passed"],
        ["Jack Taylor", "jack.taylor@email.com", "Bradford", "Pending"],
        ["Priya Sharma", "priya.sharma@email.com", "Manchester", "Passed"],
        ["Daniel Wilson", "daniel.wilson@email.com", "Leeds", "Passed"],
        ["Amara Okafor", "amara.okafor@email.com", "Birmingham", "Pending"],
        ["Ryan O'Connor", "ryan.oconnor@email.com", "Liverpool", "Passed"],
        ["Zara Khan", "zara.khan@email.com", "Bradford", "Passed"],
    ],
    col_widths=[100, 175, 85, 70],
))

# 5. Test Data Summary
elements.append(Paragraph("5. Loaded Test Data", section_style))
elements.append(make_table(
    ["Data", "Count", "Notes"],
    [
        ["Active Pharmacies", "8", "Manchester, Birmingham, Leeds, Liverpool, Bradford"],
        ["Products / Services", "98+", "OTC, Pharmacy Medicines, Consultations, Prescriptions"],
        ["Online Orders", "28", "Across all statuses (Received to Delivered)"],
        ["In-Branch Bookings", "20", "Past and upcoming appointments"],
        ["Patient Accounts", "10", "With profiles, IDV status, addresses"],
        ["Pharmacy Wallets", "8", "With earnings, commission, available balance"],
        ["Sponsored Ads", "4", "Active ad campaigns for featured pharmacies"],
        ["Subscription Packages", "4", "Early Bird, Starter, Professional, Enterprise"],
    ],
    col_widths=[130, 50, 310],
))

# 6. Key Test Flows
elements.append(Paragraph("6. Key Test Flows", section_style))
flows = [
    "<b>Patient Order Flow:</b> Login as patient > Browse marketplace > Select pharmacy > Choose product > Complete questionnaire > IDV > Consent & Pay > Track order",
    "<b>Pharmacy Dashboard:</b> Login as pharmacy owner > View dashboard > Manage services > View orders > Process dispatch > Check earnings > Request payout",
    "<b>Prescriber Review:</b> Login as prescriber > View prescriber queue > Review order > Approve/Reject/Query > Generate prescription",
    "<b>Super Admin:</b> Login as admin > View platform stats > Manage tenants > Approve payouts > Monitor marketplace",
    "<b>Marketplace:</b> Visit homepage > Enter postcode > Browse pharmacies > View storefront > Place order",
]
for f in flows:
    elements.append(Paragraph(f"&bull; {f}", ParagraphStyle("Flow", parent=body_style, spaceAfter=4, leftIndent=10)))

elements.append(Spacer(1, 16))
elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
elements.append(Paragraph(f"Pharmacy One Stop &mdash; TSP Development Team &mdash; {datetime.now().strftime('%B %Y')}", ParagraphStyle("Footer", parent=note_style, alignment=TA_CENTER)))

doc.build(elements)
print(f"PDF generated: {OUTPUT}")
