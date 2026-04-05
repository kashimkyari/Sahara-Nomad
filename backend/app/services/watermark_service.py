import os
from datetime import datetime

# Optional: try importing Pillow, gracefully degrading if not installed.
try:
    from PIL import Image, ImageDraw, ImageFont
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

def apply_pod_watermark(image_path: str, runner_name: str, lat: float, lng: float):
    """
    Applies a neo-brutalist watermark to the lower portion of the image.
    Contains timestamp, user, and GPS coordinates for irrefutable proof.
    """
    if not PILLOW_AVAILABLE:
        # Pillow is not installed, silently skip watermarking instead of crashing
        print("Pillow not installed. Skipping POD watermark.")
        return

    try:
        if not os.path.exists(image_path):
            return

        with Image.open(image_path) as img:
            # We want to format the image for standard delivery views, converting to RGB
            img = img.convert("RGB")
            draw = ImageDraw.Draw(img)
            
            width, height = img.size
            
            # Neo-Brutalist design: solid black rectangle at the bottom
            banner_height = int(height * 0.15) if height > 800 else 100
            
            # Use default font
            try:
                # Pillow default font is very small, we'd scale it but load_default doesn't support size.
                font = ImageFont.load_default()
            except:
                font = None
            
            # Draw black background
            draw.rectangle(
                [(0, height - banner_height), (width, height)],
                fill="black", outline="red", width=3
            )
            
            # Determine texts
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            coord_str = f"GPS: {lat}, {lng}" if lat is not None and lng is not None else "GPS: Unavailable"
            text_str = f"SendAm PROOF OF DELIVERY\n{timestamp_str} | Runner: {runner_name}\n{coord_str}"
            
            # Draw Text
            draw.text(
                (20, height - banner_height + 10),
                text_str,
                fill="white",
                font=font
            )
            
            # Save it back overwriting the same file
            img.save(image_path, format="JPEG", quality=85)
    except Exception as e:
        print(f"Failed to apply watermark: {e}")
