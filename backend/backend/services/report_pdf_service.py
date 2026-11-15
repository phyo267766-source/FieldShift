"""Small dependency-free PDF renderer for saved farm reports."""
import textwrap

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
LEFT_MARGIN = 54
RIGHT_MARGIN = 54
TOP_MARGIN = 56
BOTTOM_MARGIN = 54
BODY_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN


def _pdf_string(value):
    text = str(value).replace('→', ' -> ').replace('–', '-').replace('—', '-')
    encoded = text.encode('cp1252', errors='replace')
    escaped = bytearray()
    for char in encoded:
        if char in (ord('\\'), ord('('), ord(')')):
            escaped.extend(b'\\' + bytes((char,)))
        elif char < 32 or char > 126:
            escaped.extend(f'\\{char:03o}'.encode('ascii'))
        else:
            escaped.append(char)
    return bytes(escaped)


def _report_lines(report_data):
    farm = report_data.get('farm') or {}
    climate = report_data.get('climate') or {}
    summary = climate.get('summary') or {}
    rotation = report_data.get('rotation') or {}
    plan = rotation.get('selected_plan') or rotation.get('latest_plan')
    lines = [
        (f'{farm.get("name") or "Farm"} - Farm Report', 18, True),
        ('Farm profile', 13, True),
        (f'Country / State / Region: {farm.get("country") or "Not recorded"} / {farm.get("region") or "Not recorded"}', 10, False),
        (f'District: {farm.get("district") or "Not recorded"}', 10, False),
        (f'Township: {farm.get("township") or "Not recorded"}', 10, False),
        (f'Farm size: {farm.get("area") if farm.get("area") is not None else "Not recorded"} {farm.get("area_unit") or ""}'.strip(), 10, False),
        (f'Soil type: {farm.get("soil_type") or "Not recorded"}', 10, False),
        (f'Current crop: {farm.get("current_crop") or "Not recorded"}', 10, False),
        (f'Previous crop: {farm.get("previous_crop") or "Not recorded"}', 10, False),
        (f'Planting season: {farm.get("planting_season") or "Not recorded"}', 10, False),
        ('NASA POWER climate observations', 13, True),
        (f'Data source: {climate.get("source") or "Not recorded"}', 10, False),
    ]

    date_range = summary.get('date_range') or {}
    if date_range.get('start') and date_range.get('end'):
        lines.append((f'Observation period: {date_range["start"]} to {date_range["end"]}', 10, False))

    temperature = summary.get('temperature') or {}
    rainfall = summary.get('rainfall') or {}
    humidity = summary.get('humidity') or {}
    soil_wetness = summary.get('soil_wetness') or {}
    if temperature.get('average') is not None:
        lines.append((f'Average temperature: {temperature["average"]} {temperature.get("unit", "C")}', 10, False))
    if rainfall.get('total') is not None:
        lines.append((f'Total rainfall: {rainfall["total"]} {rainfall.get("unit", "mm")}', 10, False))
    if humidity.get('average') is not None:
        lines.append((f'Average humidity: {humidity["average"]} {humidity.get("unit", "%")}', 10, False))
    if soil_wetness.get('average') is not None:
        lines.append((f'Average soil wetness: {soil_wetness["average"]} {soil_wetness.get("unit", "unitless fraction")}', 10, False))

    risks = climate.get('risks') or []
    if risks:
        lines.append(('Climate risk assessment', 13, True))
        lines.extend((
            f'{risk.get("risk", "Risk")}: {risk.get("level", "Not rated")} - {risk.get("description", "")}'.rstrip(' -'),
            10,
            False,
        ) for risk in risks)

    if plan:
        lines.append((
            'Selected rotation plan' if rotation.get('selected_plan') else 'Latest generated plan (not marked selected)',
            13,
            True,
        ))
        lines.append((f'Crop sequence: {" -> ".join(plan.get("sequence") or [])}', 10, False))
        if plan.get('score') is not None:
            lines.append((f'Suitability score: {plan["score"]} / 100 (illustrative rule-based score)', 10, False))
        if plan.get('explanation'):
            lines.append((f'Explanation: {plan["explanation"]}', 10, False))
        for season in plan.get('season_details') or []:
            label = season.get('season_label') or season.get('season_name') or 'Season'
            detail = f'{label}: {season.get("crop") or "Crop not recorded"}'
            if season.get('period'):
                detail += f' ({season["period"]})'
            lines.append((detail, 10, False))
        for benefit in plan.get('benefits') or []:
            title = benefit.get('title') if isinstance(benefit, dict) else str(benefit)
            description = benefit.get('desc') if isinstance(benefit, dict) else ''
            lines.append((f'Plan benefit: {title} {description}'.strip(), 10, False))
    else:
        lines.extend([
            ('Crop rotation plan', 13, True),
            ('No saved rotation plan is available. No plan has been selected.', 10, False),
        ])

    lines.extend([
        ('', 10, False),
        ('Suitability scores are illustrative estimates, not guaranteed yield outcomes.', 9, False),
    ])

    return lines


def create_report_pdf(report_data):
    """Render a saved report with consistent paragraph spacing and pagination."""
    paragraphs = _report_lines(report_data)
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ]
    page_refs = []

    pages = []
    content_commands = []
    y = PAGE_HEIGHT - TOP_MARGIN

    def finish_page():
        nonlocal content_commands, y
        pages.append(b'\n'.join(content_commands))
        content_commands = []
        y = PAGE_HEIGHT - TOP_MARGIN

    def draw_line(text, size, bold, baseline):
        font = 'F2' if bold else 'F1'
        content_commands.append(
            f'BT /{font} {size} Tf {LEFT_MARGIN} {baseline:.2f} Td '.encode('ascii')
            + b'(' + _pdf_string(text) + b') Tj ET'
        )

    def wrapped(text, size):
        wrap_width = max(20, int(BODY_WIDTH / (float(size) * 0.56)))
        return textwrap.wrap(
            text,
            width=wrap_width,
            break_long_words=True,
            break_on_hyphens=False,
        ) or ['']

    for index, (text, size, bold) in enumerate(paragraphs):
        if not text:
            y -= 8
            continue

        font_size = float(size)
        if font_size >= 18:
            leading, before, after = 26, 0, 10
        elif bold:
            leading, before, after = 18, 12, 5
        elif font_size <= 9:
            leading, before, after = 13, 8, 0
        else:
            leading, before, after = 14, 0, 5

        wrapped_lines = wrapped(text, size)
        paragraph_height = len(wrapped_lines) * leading

        if text.startswith('Plan benefit:') and (
            index == 0 or not paragraphs[index - 1][0].startswith('Plan benefit:')
        ):
            group_height = 0
            group_index = index
            while group_index < len(paragraphs) and paragraphs[group_index][0].startswith('Plan benefit:'):
                group_height += len(wrapped(paragraphs[group_index][0], 10)) * 14 + 5
                group_index += 1
            if (
                group_index < len(paragraphs)
                and paragraphs[group_index][0].startswith('Suitability scores')
            ):
                group_height += len(wrapped(paragraphs[group_index][0], 9)) * 13 + 8
            if y - group_height < BOTTOM_MARGIN:
                finish_page()

        # Keep a section heading with at least the first line of its content.
        following_line_height = 0
        if bold and index + 1 < len(paragraphs):
            next_text, next_size, _ = paragraphs[index + 1]
            if next_text:
                following_line_height = 14 if next_size > 9 else 13

        if y - before - paragraph_height - after - following_line_height < BOTTOM_MARGIN:
            finish_page()

        y -= before
        for line in wrapped_lines:
            if y - leading < BOTTOM_MARGIN:
                finish_page()
            y -= leading
            draw_line(line, size, bold, y)
        y -= after

    if content_commands or not pages:
        finish_page()

    for stream in pages:
        content_id = len(objects) + 1
        objects.append(
            b'<< /Length ' + str(len(stream)).encode('ascii') + b' >>\nstream\n'
            + stream + b'\nendstream'
        )
        page_id = len(objects) + 1
        objects.append(
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
            b'/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> '
            b'/Contents ' + str(content_id).encode('ascii') + b' 0 R >>'
        )
        page_refs.append(f'{page_id} 0 R')

    objects[1] = (
        f'<< /Type /Pages /Kids [{" ".join(page_refs)}] /Count {len(page_refs)} >>'
    ).encode('ascii')

    pdf = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = [0]
    for object_id, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f'{object_id} 0 obj\n'.encode('ascii'))
        pdf.extend(body)
        pdf.extend(b'\nendobj\n')

    xref_offset = len(pdf)
    pdf.extend(f'xref\n0 {len(objects) + 1}\n'.encode('ascii'))
    pdf.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        pdf.extend(f'{offset:010d} 00000 n \n'.encode('ascii'))
    pdf.extend(
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref_offset}\n%%EOF\n'.encode('ascii')
    )
    return bytes(pdf)
