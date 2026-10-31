import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models import Project

def generate_pdf_report(project: Project) -> bytes:
    """Generates an elegant, professional PDF report for an interior design project."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "ProjectTitle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1A202C"),
        fontName="Helvetica-Bold",
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        "ProjectSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#2B6CB0"),
        fontName="Helvetica-Bold",
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#2D3748")
    )

    story = []

    # Title Banner
    story.append(Paragraph("Smart Room AI — Interior Design Project Report", title_style))
    created_str = project.created_at.strftime("%B %d, %Y") if project.created_at else datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"<b>Project:</b> {project.name} &nbsp;|&nbsp; <b>Room:</b> {project.room_type.capitalize()} &nbsp;|&nbsp; <b>Style:</b> {project.selected_style.capitalize()} &nbsp;|&nbsp; <b>Date:</b> {created_str}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#CBD5E0"), spaceAfter=12))

    # Project Details & Dimensions
    story.append(Paragraph("1. Room Measurements & Geometry", section_heading))
    p_dict = project.to_dict()
    dims = p_dict.get("dimensions", {})
    l = dims.get("length", 14)
    w = dims.get("width", 12)
    h = dims.get("height", 9)
    unit = dims.get("unit", "feet")

    floor_area = round(float(l) * float(w), 1)
    wall_area = round(2 * float(h) * (float(l) + float(w)), 1)
    volume = round(float(l) * float(w) * float(h), 1)

    dim_data = [
        ["Metric", "Value", "Unit"],
        ["Room Dimensions (L × W × H)", f"{l} × {w} × {h}", unit],
        ["Floor Area", f"{floor_area}", f"sq {unit}"],
        ["Gross Wall Surface Area", f"{wall_area}", f"sq {unit}"],
        ["Room Volume", f"{volume}", f"cubic {unit}"],
        ["Recommended Usable Furniture Area (~65%)", f"{round(floor_area * 0.65, 1)}", f"sq {unit}"],
        ["Recommended Walking Corridors (~35%)", f"{round(floor_area * 0.35, 1)}", f"sq {unit}"],
    ]

    t_dims = Table(dim_data, colWidths=[2.8 * inch, 2.5 * inch, 1.8 * inch])
    t_dims.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#2D3748")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_dims)
    story.append(Spacer(1, 10))

    # Color Palette & Finishes
    story.append(Paragraph("2. Selected Color Palette & Finishes", section_heading))
    colors_data = p_dict.get("selected_colors", {})
    palette_rows = [["Role", "Color Name / Hex Code", "Application Area"]]
    
    if isinstance(colors_data, dict) and colors_data:
        for role, val in colors_data.items():
            palette_rows.append([role.replace("_", " ").title(), str(val), "Interior Wall / Ceiling"])
    else:
        palette_rows.append(["Main Wall", "#F4F5F7 (Crisp Off-White)", "Perimeter Walls"])
        palette_rows.append(["Accent Wall", "#2B303A (Smoky Charcoal)", "Headboard / Media Feature"])
        palette_rows.append(["Ceiling", "#FFFFFF (Pure White)", "Ceiling Surface"])
        palette_rows.append(["Trim", "#D1D5DB (Warm Platinum)", "Skirting & Door Frames"])

    t_colors = Table(palette_rows, colWidths=[2.2 * inch, 2.8 * inch, 2.1 * inch])
    t_colors.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_colors)
    story.append(Spacer(1, 10))

    # Furniture Selections & Budget Estimates
    story.append(Paragraph("3. Furniture Plan & Estimated Investment (INR)", section_heading))
    furniture_items = p_dict.get("furniture_selections", [])
    
    furn_table_data = [["Item Name", "Category", "Dimensions", "Estimated Price (INR)"]]
    total_furn_cost = 0

    if isinstance(furniture_items, list) and furniture_items:
        for f in furniture_items:
            name = f.get("name", "Furniture Piece")
            cat = f.get("category", "Furniture")
            dims_str = f.get("dimensions", "Standard")
            price = f.get("estimated_price_inr", f.get("price_numeric", 0))
            try:
                price_val = float(price)
            except Exception:
                price_val = 0
            total_furn_cost += price_val
            furn_table_data.append([name, cat, dims_str, f"₹{int(price_val):,}"])
    else:
        furn_table_data.append(["Queen Storage Bed with Boucle Headboard", "Bed", "6.5 × 5.2 ft", "₹38,000"])
        furn_table_data.append(["Floating 2-Drawer Bedside Tables (Pair)", "Nightstand", "1.8 × 1.3 ft", "₹14,000"])
        furn_table_data.append(["Floor-to-Ceiling 3-Door Acrylic Wardrobe", "Wardrobe", "7.0 × 2.0 ft", "₹65,000"])
        furn_table_data.append(["Minimalist Work Desk & Ergonomic Chair", "Desk", "4.0 × 1.8 ft", "₹22,000"])
        total_furn_cost = 139000

    furn_table_data.append(["TOTAL ESTIMATED FURNITURE INVESTMENT", "", "", f"₹{int(total_furn_cost):,}"])

    t_furn = Table(furn_table_data, colWidths=[2.7 * inch, 1.4 * inch, 1.5 * inch, 1.5 * inch])
    t_furn.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 4.5),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FEFCBF")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(t_furn)
    story.append(Spacer(1, 14))

    # Notes & Disclaimer
    story.append(Paragraph("4. Implementation Notes & Disclaimer", section_heading))
    disclaimer_text = (
        "<b>Important Notice:</b> All dimensions and spatial metrics generated in this report are for conceptual planning "
        "and architectural visualization. Please conduct a physical laser measurement before commissioning custom carpentry, "
        "cabinetry, or purchasing large appliances. Prices shown are estimated market rates in Indian Rupees (INR) and are subject "
        "to local vendor quotes, material fluctuations, and contractor labor rates."
    )
    story.append(Paragraph(disclaimer_text, body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
