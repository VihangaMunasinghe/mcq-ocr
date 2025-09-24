def generate_template_pdf(titel:str, questions:int, options:int, max_qpc:int) -> bytes:
    '''Generate a PDF of the MCQ template'''
    # Dummy implementation for illustration
    result = b"%PDF-1.4\n" \
b"1 0 obj\n" \
b"<< /Type /Catalog /Pages 2 0 R >>\n" \
b"endobj\n" \
b"2 0 obj\n" \
b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" \
b"endobj\n" \
b"3 0 obj\n" \
b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n" \
b"endobj\n" \
b"xref\n" \
b"0 4\n" \
b"0000000000 65535 f \n" \
b"0000000010 00000 n \n" \
b"0000000053 00000 n \n" \
b"0000000102 00000 n \n" \
b"trailer\n" \
b"<< /Root 1 0 R /Size 4 >>\n" \
b"startxref\n" \
b"151\n" \
b"%%EOF\n"
    return result