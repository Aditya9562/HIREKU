import fitz
import sys

def parse_pdf(pdf_path, output_txt_path):
    doc = fitz.open(pdf_path)
    with open(output_txt_path, 'w', encoding='utf-8') as f:
        f.write(f"PDF Path: {pdf_path}\n")
        f.write(f"Number of Pages: {len(doc)}\n\n")
        
        for p_idx, page in enumerate(doc):
            f.write(f"--- PAGE {p_idx+1} (Size: {page.rect.width} x {page.rect.height}) ---\n")
            
            # Extract detailed block structures
            blocks = page.get_text("blocks")
            for b_idx, b in enumerate(blocks):
                x0, y0, x1, y1, text, block_no, block_type = b
                f.write(f"\nBlock {b_idx} (Coords: {round(x0, 2)}, {round(y0, 2)} -> {round(x1, 2)}, {round(y1, 2)}):\n")
                f.write(text)
                
            # Extract single characters or spans to check font sizes
            f.write("\n\n--- SPANS (FONT DETAILS) ---\n")
            dict_data = page.get_text("dict")
            for block in dict_data["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            f.write(f"Font: {span['font']} | Size: {round(span['size'], 2)} | Color: {span['color']} | Text: {repr(span['text'])}\n")
            f.write("\n\n")

if __name__ == '__main__':
    orig_path = r"C:\Users\aditya\OneDrive - Universitas Diponegoro\CV\DOCS\MANDIRI ODP\Aditya_Putra_Afendi_ODP_IT_BankMandiri.pdf"
    gen_path = r"C:\Users\aditya\Downloads\optimized_2deec76d-3ba9-438a-8844-e05ce1967111.pdf"
    
    parse_pdf(orig_path, "original_cv_parsed.txt")
    parse_pdf(gen_path, "generated_cv_parsed.txt")
    print("Done writing to original_cv_parsed.txt and generated_cv_parsed.txt")
