"""
Descargador de fuentes Google Fonts para autoalojamiento local en landing/fonts/.
Elimina dependencias externas y llamadas de red a Google Fonts.
"""

import httpx
import re
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

URL_PLUS_JAKARTA = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
URL_JETBRAINS = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap"

def descargar_fuentes():
    fonts_dir = "landing/fonts"
    css_path = "landing/css/fonts.css"
    os.makedirs(fonts_dir, exist_ok=True)
    os.makedirs(os.path.dirname(css_path), exist_ok=True)

    client = httpx.Client(headers=HEADERS, timeout=15.0)

    combined_css = []

    for name, url in [("Plus Jakarta Sans", URL_PLUS_JAKARTA), ("JetBrains Mono", URL_JETBRAINS)]:
        print(f"Obteniendo CSS para {name}...")
        resp = client.get(url)
        resp.raise_for_status()
        css_content = resp.text

        # Encontrar todas las URLs de fuentes woff2
        url_matches = re.findall(r"url\((https://[^\)]+\.woff2)\)", css_content)
        print(f"  Encontradas {len(url_matches)} variantes woff2 para {name}.")

        for font_url in set(url_matches):
            filename = font_url.split("/")[-1]
            if not filename.endswith(".woff2"):
                filename += ".woff2"
            
            # Prefijar con el nombre de la fuente para claridad
            prefix = "plus-jakarta-sans" if "Jakarta" in name else "jetbrains-mono"
            local_filename = f"{prefix}-{filename}"
            local_filepath = os.path.join(fonts_dir, local_filename)

            if not os.path.exists(local_filepath):
                print(f"    Descargando {local_filename}...")
                f_resp = client.get(font_url)
                f_resp.raise_for_status()
                with open(local_filepath, "wb") as f:
                    f.write(f_resp.content)
            
            # Reemplazar la URL remota por la ruta relativa en el CSS
            css_content = css_content.replace(font_url, f"../fonts/{local_filename}")

        combined_css.append(f"/* === {name} (Self-Hosted) === */\n" + css_content)

    with open(css_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(combined_css))

    print(f"Fuentes autoalojadas guardadas en {fonts_dir}/ y archivo CSS generado en {css_path}")

if __name__ == "__main__":
    descargar_fuentes()
