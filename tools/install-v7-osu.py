#!/usr/bin/env python3
"""Install Battle Chess v7 without overwriting OSU's repaired game index or fallback.
Usage: python3 install-v7-osu.py <pinned 40-character commit SHA>
"""
from pathlib import Path
from datetime import datetime
import os, re, shutil, sys, urllib.request

FILES = ('battle.js', 'computer-v7.js', 'audio-v7.js', 'experience-v7.js',
         'experience-v7.css', 'duels.js', 'duels-v7-audio.js', 'handheld.html')
ROOT = Path.home() / 'public_html'
GAME = ROOT / 'games' / '3d-battle-chess'

def patched_projects(raw):
    if 'games/3d-battle-chess/handheld.html' in raw:
        return raw, 'Handheld project link already exists'
    # Identify just the Battle Chess tile, not an adjacent Evil Wizard card.
    tags = list(re.finditer(r'<(/?)(article|div)\b[^>]*>', raw, re.I | re.S))
    stack, ranges = [], []
    for match in tags:
        closing, kind = bool(match.group(1)), match.group(2).lower()
        if not closing:
            stack.append((kind, match.start(), match.end(), match.group(0)))
        else:
            for i in range(len(stack)-1, -1, -1):
                if stack[i][0] == kind:
                    open_tag = stack[i]
                    ranges.append((open_tag[1], match.start(), match.end(), kind, open_tag[3]))
                    stack = stack[:i]
                    break
    candidates = []
    for title in re.finditer(r'3D\s+Battle\s+Chess', raw, re.I):
        for start, closing, end, kind, tag in ranges:
            if not start < title.start() < closing:
                continue
            chunk = raw[start:end]
            if '3d-battle-chess' not in chunk.lower():
                continue
            card = bool(re.search(r'class\s*=\s*["\'][^"\']*\b(?:project-card|project-tile|card)\b', tag, re.I))
            if card or kind == 'article':
                candidates.append((end-start, start, closing, end, chunk))
    if not candidates:
        return raw, 'Card not changed: could not isolate the Battle Chess tile safely'
    _, start, closing, end, chunk = min(candidates)
    source = re.search(r'<a\b[^>]*href\s*=\s*["\']https://github\.com/joshprandall/3d-battle-chess(?:/[^"\']*)?["\'][^>]*>.*?</a>', chunk, re.I | re.S)
    link = '<a href="games/3d-battle-chess/handheld.html" class="chess-handheld-project-link" style="display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;color:#f4a785;font-weight:600;text-decoration:none;">Play handheld ↗</a>'
    insert = start + source.end() if source else closing
    return raw[:insert] + '\n' + link + raw[insert:], 'Added Play handheld to Battle Chess tile'

def main():
    if len(sys.argv) != 2 or not re.fullmatch('[0-9a-f]{40}', sys.argv[1]):
        raise SystemExit('STOP: pass the exact 40-character tested commit SHA')
    if not GAME.is_dir() or not (GAME/'index.html').is_file() or not (ROOT/'projects.html').is_file():
        raise SystemExit('STOP: expected OSU game or projects.html is missing; nothing changed')
    ref = sys.argv[1]
    base = f'https://raw.githubusercontent.com/joshprandall/3d-battle-chess/{ref}/'
    payload = {}
    for filename in FILES:
        with urllib.request.urlopen(base+filename, timeout=35) as response:
            payload[filename] = response.read()
        if not payload[filename] or (b'<!doctype html>' in payload[filename] and filename.endswith('.js')):
            raise SystemExit('STOP: invalid download: '+filename)
    for name, token in {'battle.js':b'chooseComputerMoveV7', 'experience-v7.js':b'set2D',
                        'audio-v7.js':b'createChessAudio', 'handheld.html':b'handheld'}.items():
        if token not in payload[name]:
            raise SystemExit('STOP: download failed validation: '+name)
    project_path = ROOT/'projects.html'
    projects = project_path.read_text(encoding='utf-8')
    project_new, result = patched_projects(projects)
    backup = Path.home()/f'battle-chess-v7-backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    backup.mkdir(mode=0o700)
    for filename in FILES:
        source = GAME/filename
        if source.is_file():
            shutil.copy2(source, backup/filename)
    shutil.copy2(project_path, backup/'projects.html')
    installed=[]
    try:
        for filename, data in payload.items():
            staging = GAME/(filename+'.v7-new')
            staging.write_bytes(data)
            os.chmod(staging, 0o644)
        for filename in FILES:
            os.replace(GAME/(filename+'.v7-new'), GAME/filename)
            installed.append(filename)
        if project_new != projects:
            stage = ROOT/'projects.html.v7-new'
            stage.write_text(project_new, encoding='utf-8')
            os.chmod(stage, 0o644)
            os.replace(stage, project_path)
    except Exception:
        for filename in installed:
            original = backup/filename
            if original.is_file():
                shutil.copy2(original, GAME/filename)
            else:
                (GAME/filename).unlink(missing_ok=True)
        shutil.copy2(backup/'projects.html', project_path)
        raise
    finally:
        for filename in FILES:
            (GAME/(filename+'.v7-new')).unlink(missing_ok=True)
    print('Battle Chess v7 installed; existing index.html and fallback preserved.')
    print(result)
    print('Backup:', backup)
    print('Handheld URL: https://web.engr.oregonstate.edu/~randjosh/games/3d-battle-chess/handheld.html')

if __name__=='__main__':
    main()
