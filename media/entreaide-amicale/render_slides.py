from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
WIDTH, HEIGHT = 1080, 1920
FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

SLIDES = [
    {"title": "JAF Dossier", "body": "Transformez des documents éparpillés en un dossier clair, structuré et facile à relire.", "accent": "UN OUTIL PENSÉ POUR LES PARENTS SÉPARÉS"},
    {"title": "Une histoire lisible", "body": "Des faits datés, sourcés et reliés aux pièces utiles.", "accent": "LA CHRONOLOGIE EN UN COUP D’ŒIL", "screenshot": "capture-chronologie.png"},
    {"title": "Chaque preuve à sa place", "body": "Date, source, catégorie, recherche instantanée et liens avec les faits.", "accent": "FINI LES PIÈCES INTROUVABLES", "screenshot": "capture-preuves.png"},
    {"title": "Du fait à la demande", "body": "Visualisez ce qui soutient chaque demande — et ce qu’il reste à compléter.", "accent": "UNE VISION CLAIRE DU DOSSIER", "screenshot": "capture-analyse.png"},
    {"title": "Vos données restent chez vous", "body": "Fonctionnement local et export complet en PDF, DOCX, XLSX et ZIP pour préparer le rendez-vous avec l’avocat.", "accent": "LOCAL • STRUCTURÉ • OPEN SOURCE", "note": "L’outil ne remplace pas un conseil juridique."},
    {"title": "Un projet à installer", "body": "JAF Dossier s’exécute avec Docker. Quelques connaissances techniques sont nécessaires pour le mettre en route.", "accent": "TRANSPARENCE AVANT TOUT"},
    {"title": "Envie de le découvrir ?", "body": "Je peux partager le dépôt GitHub avec les membres intéressés.", "accent": "Entraide Amicale", "note": "Écrivez-moi dans le groupe"},
]


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def wrapped_lines(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.splitlines():
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if current and draw.textbbox((0, 0), candidate, font=face)[2] > max_width:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
    return lines


def draw_centered_lines(draw: ImageDraw.ImageDraw, lines: list[str], face: ImageFont.FreeTypeFont, y: int, fill: str, spacing: int) -> int:
    for line in lines:
        box = draw.textbbox((0, 0), line, font=face)
        draw.text(((WIDTH - (box[2] - box[0])) / 2, y), line, font=face, fill=fill)
        y += box[3] - box[1] + spacing
    return y


def paste_rounded_screenshot(canvas: Image.Image, filename: str, box: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = box
    shot = Image.open(ROOT / filename).convert("RGB")
    shot = ImageOps.fit(shot, (x2 - x1, y2 - y1), method=Image.Resampling.LANCZOS)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, shot.width, shot.height), radius=28, fill=255)
    canvas.paste(shot, (x1, y1), mask)
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=28, outline=(240, 193, 114, 245), width=5)


background = Image.open(ROOT / "background.png").convert("RGB")
background = ImageOps.fit(background, (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)

for index, slide in enumerate(SLIDES, start=1):
    canvas = background.filter(ImageFilter.GaussianBlur(radius=1.2)).convert("RGBA")
    canvas = Image.alpha_composite(canvas, Image.new("RGBA", canvas.size, (20, 55, 40, 160)))
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle((80, 105, 1000, 200), radius=45, fill=(244, 238, 220, 238))
    group_face = font(FONT_BOLD, 36)
    group = "Entraide Amicale"
    group_box = draw.textbbox((0, 0), group, font=group_face)
    draw.text(((WIDTH - (group_box[2] - group_box[0])) / 2, 132), group, font=group_face, fill="#173b2b")

    draw.rounded_rectangle((55, 350, 1025, 1595), radius=50, fill=(18, 49, 36, 218), outline=(240, 193, 114, 190), width=3)
    draw.rounded_rectangle((135, 420, 945, 500), radius=34, fill=(240, 193, 114, 240))
    accent_size = 26 if len(slide["accent"]) > 34 else 30
    accent_face = font(FONT_BOLD, accent_size)
    accent_box = draw.textbbox((0, 0), slide["accent"], font=accent_face)
    draw.text(((WIDTH - (accent_box[2] - accent_box[0])) / 2, 446), slide["accent"], font=accent_face, fill="#173b2b")

    title_size = 72 if len(slide["title"]) > 23 else 82
    title_face = font(FONT_BOLD, title_size)
    title_lines = wrapped_lines(draw, slide["title"], title_face, 850)
    y = draw_centered_lines(draw, title_lines, title_face, 580, "#fffaf0", 16) + 45
    body_face = font(FONT_REGULAR, 44 if slide.get("screenshot") else 52)
    body_lines = wrapped_lines(draw, slide["body"], body_face, 830)
    draw_centered_lines(draw, body_lines, body_face, y, "#f6f1e4", 22)

    if slide.get("screenshot"):
        paste_rounded_screenshot(canvas, slide["screenshot"], (105, 970, 975, 1514))

    note = slide.get("note")
    if note:
        note_face = font(FONT_BOLD, 35)
        note_lines = wrapped_lines(draw, note, note_face, 780)
        draw_centered_lines(draw, note_lines, note_face, 1390 if not slide.get("screenshot") else 1518, "#f0c172", 15)

    footer_face = font(FONT_REGULAR, 29)
    footer = "Projet open source • Données locales • Document de travail"
    footer_box = draw.textbbox((0, 0), footer, font=footer_face)
    draw.text(((WIDTH - (footer_box[2] - footer_box[0])) / 2, 1730), footer, font=footer_face, fill="#f6f1e4")
    draw.rectangle((370, 1800, 710, 1808), fill="#f0c172")
    canvas.convert("RGB").save(ROOT / f"slide-v2-{index:02d}.png", quality=95)

(ROOT / "slides-v2.txt").write_text(
    "".join([
        "file 'slide-v2-01.png'\nduration 3.5\n",
        "file 'slide-v2-02.png'\nduration 4\n",
        "file 'slide-v2-03.png'\nduration 4\n",
        "file 'slide-v2-04.png'\nduration 4\n",
        "file 'slide-v2-05.png'\nduration 3.5\n",
        "file 'slide-v2-06.png'\nduration 3.5\n",
        "file 'slide-v2-07.png'\nduration 4\n",
        "file 'slide-v2-07.png'\n",
    ]),
    encoding="utf-8",
)
