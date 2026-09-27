import urllib.request

urls = [
    'http://localhost:8080/index.html',
    'http://localhost:8080/css/style.css',
    'http://localhost:8080/js/main.js',
    'http://localhost:8080/js/game.js',
    'http://localhost:8080/js/constants.js',
    'http://localhost:8080/js/levels.js',
    'http://localhost:8080/js/player.js',
    'http://localhost:8080/js/echo.js',
    'http://localhost:8080/js/renderer.js',
    'http://localhost:8080/js/particles.js',
    'http://localhost:8080/js/audio.js'
]

all_ok = True
for url in urls:
    try:
        req = urllib.request.urlopen(url)
        status = req.getcode()
        print(f"[OK] {url} -> {status}")
        if status != 200:
            all_ok = False
    except Exception as e:
        print(f"[FAIL] {url} -> {e}")
        all_ok = False

if all_ok:
    print("\n=== ALL 11 ASSETS SERVED WITH HTTP 200 OK! ===")
else:
    print("\n=== ERROR SERVING ASSETS ===")
    exit(1)
