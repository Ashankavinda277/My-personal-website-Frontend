import urllib.request
import json
import math

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/blogs?limit=100") as url:
        data = json.loads(url.read().decode())
        items = data.get("items", [])
        print(f"Found {len(items)} blogs.")
        for blog in items:
            title = blog.get("title", "No Title")
            content = blog.get("content", "")
            # simulate split(/\s+/) roughly
            word_count = len(content.split()) if content else 0
            est_min = max(1, math.ceil(word_count / 200))
            print(f"Title: {title[:20]}... | Words: {word_count} | Calc Min: {est_min}")
except Exception as e:
    print(f"Error: {e}")
