"""
Generador de imagen Open Graph (1200x630) para LicitaciónYa.
Fondo corporativo navy, marca, propuesta de valor y métricas auditadas.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def generar_og_image(output_path="landing/og-image.png"):
    width = 1200
    height = 630

    # Crear imagen base
    img = Image.new("RGB", (width, height), color="#0F2744")
    draw = ImageDraw.Draw(img)

    # Intentar cargar fuentes del sistema Windows (Segoe UI) o usar fallback
    def get_font(size, bold=False):
        font_names = [
            "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        ]
        for f in font_names:
            if os.path.exists(f):
                try:
                    return ImageFont.truetype(f, size)
                except Exception:
                    pass
        return ImageFont.load_default()

    font_badge = get_font(20, bold=True)
    font_title = get_font(72, bold=True)
    font_sub = get_font(30, bold=False)
    font_metric_num = get_font(42, bold=True)
    font_metric_lbl = get_font(18, bold=False)
    font_footer = get_font(18, bold=False)

    # 1. Borde perimetral sutil decorativo
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline="#1E3A8A", width=2)

    # 2. Badge superior
    badge_text = "ECUADOR  •  SERCOP B2B  •  ESTÁNDAR OCDS"
    draw.rounded_rectangle([(80, 70), (520, 110)], radius=20, fill="#1E3A8A")
    draw.text((105, 78), badge_text, fill="#38BDF8", font=font_badge)

    # 3. Título principal
    draw.text((80, 140), "LicitaciónYa", fill="#FFFFFF", font=font_title)

    # 4. Subtítulo / Propuesta
    sub_text = "Monitoreo Automatizado de Contratación Pública en Ecuador"
    draw.text((80, 235), sub_text, fill="#94A3B8", font=font_sub)

    sub_text2 = "Alertas a WhatsApp por rubro exacto y reporte en Excel los lunes 8:00 AM"
    draw.text((80, 280), sub_text2, fill="#CBD5E1", font=font_sub)

    # 5. Tarjetas de métricas auditadas
    metrics = [
        ("+$2.3M USD", "Procesos Detectados", "#10B981"),
        ("68%", "Convocatoria Abierta", "#38BDF8"),
        ("Cada 6 Horas", "Inspección Algorítmica", "#F59E0B"),
    ]

    card_width = 320
    card_height = 130
    start_x = 80
    y_pos = 360
    gap = 40

    for i, (val, lbl, color) in enumerate(metrics):
        x = start_x + i * (card_width + gap)
        draw.rounded_rectangle([(x, y_pos), (x + card_width, y_pos + card_height)], radius=14, fill="#162D4A", outline="#1E3A8A", width=1)
        draw.text((x + 24, y_pos + 22), val, fill=color, font=font_metric_num)
        draw.text((x + 24, y_pos + 80), lbl, fill="#94A3B8", font=font_metric_lbl)

    # 6. Footer de confianza
    draw.text((80, 550), "Plataforma independiente de analítica y datos abiertos oficiales  •  licitacionya.pages.dev", fill="#64748B", font=font_footer)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG", optimize=True)
    print(f"OG Image generada con éxito en {output_path} ({width}x{height})")

if __name__ == "__main__":
    generar_og_image()
