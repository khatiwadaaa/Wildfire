"""Safely clean a known fictional TrojanScout SQLite demo database.

Run from project root: python TrojanScout_Clean_Demo_Data_Safe.py
Requires FastAPI running on localhost:8000. Verifies SQLite records against API
before writing, makes a consistent SQLite backup, and refuses ambiguous matches.
"""
import json
import sqlite3
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
API = 'http://localhost:8000/players'
UPDATES = {
    2: ('Micheal', dict(points_per_game=17.2, assists_per_game=5.1, rebounds_per_game=4.3, field_goal_percentage=45.7, three_point_percentage=34.8, steals_per_game=1.6, blocks_per_game=0.2, turnovers_per_game=2.7)),
    3: ('Ankit', dict(points_per_game=16.8, assists_per_game=4.9, rebounds_per_game=4.2, field_goal_percentage=46.1, three_point_percentage=36.8, steals_per_game=1.8, blocks_per_game=0.3, turnovers_per_game=2.4)),
    4: ('Arambha', dict(points_per_game=14.1, assists_per_game=3.6, rebounds_per_game=3.7, field_goal_percentage=44.3, three_point_percentage=31.5, steals_per_game=1.5, blocks_per_game=0.2, turnovers_per_game=2.1)),
    9: ('TrojanScout Test Recruit', dict(points_per_game=13.9, assists_per_game=2.6, rebounds_per_game=3.9, field_goal_percentage=44.7, three_point_percentage=37.2, steals_per_game=1.1, blocks_per_game=0.3, turnovers_per_game=1.8)),
    10: ('Player A', dict(points_per_game=13.8, assists_per_game=5.9, rebounds_per_game=3.4, field_goal_percentage=43.8, three_point_percentage=33.5, steals_per_game=1.7, blocks_per_game=0.1, turnovers_per_game=2.6)),
    11: ('Player B', dict(graduation_year=2028, points_per_game=9.8, assists_per_game=2.0, rebounds_per_game=5.5, field_goal_percentage=47.1, three_point_percentage=32.2, steals_per_game=0.9, blocks_per_game=0.6, turnovers_per_game=1.5)),
    12: ('Player C', dict(points_per_game=15.5, assists_per_game=4.4, rebounds_per_game=3.8, field_goal_percentage=45.2, three_point_percentage=35.9, steals_per_game=1.6, blocks_per_game=0.2, turnovers_per_game=2.2)),
}
EXCLUDE = {'.venv', 'venv', 'node_modules', '.git', 'dist', 'build', '__pycache__'}


def candidates():
    bases = (ROOT, ROOT.parent)
    found = set()
    for base in bases:
        for pat in ('*.db', '*.sqlite', '*.sqlite3'):
            for path in base.rglob(pat):
                if any(p.lower() in EXCLUDE for p in path.parts):
                    continue
                try:
                    resolved = path.resolve()
                    if resolved.is_file() and resolved not in found:
                        found.add(resolved)
                        yield resolved
                except OSError:
                    continue


def fetch_api():
    try:
        with urllib.request.urlopen(API, timeout=10) as response:
            data = json.load(response)
    except Exception as exc:
        raise SystemExit(f'ERROR: API unavailable at {API}. Start FastAPI first. {exc}')
    if not isinstance(data, list) or len(data) < 12:
        raise SystemExit('ERROR: expected live /players endpoint to return at least 12 player records; stopping.')
    api = {p['id']: p for p in data}
    for pid, (name, _) in UPDATES.items():
        if pid not in api or api[pid]['name'] != name:
            raise SystemExit(f'ERROR: live API player {pid} does not match expected demo name {name!r}. Nothing changed.')
    return api


def inspect(path, api):
    try:
        # Open read-only to avoid creating files in wrong locations.
        with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, timeout=3) as db:
            db.row_factory = sqlite3.Row
            if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='players'").fetchone():
                return False
            rows = [dict(row) for row in db.execute('SELECT * FROM players')]
        if len(rows) != len(api):
            return False
        return all(row.get('id') in api and all(
            row.get(k) == v or (isinstance(v, (float, int)) and isinstance(row.get(k), (float, int)) and abs(row[k]-v) < 1e-6)
            for k, v in api[row['id']].items() if k in row
        ) for row in rows)
    except (sqlite3.Error, OSError, KeyError, TypeError):
        return False


def main():
    api = fetch_api()
    matches = [p for p in candidates() if inspect(p, api)]
    if len(matches) != 1:
        print(f'Found {len(matches)} SQLite databases matching all {len(api)} live API players.')
        if matches:
            for p in matches: print('  ', p)
        raise SystemExit('SAFETY STOP: cannot uniquely identify the live SQLite database. No records changed.')
    path = matches[0]
    print(f'Confirmed live database: {path}')
    out = ROOT / 'demo_data_backups'
    out.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    backup_file = out / f'trojanscout_demo_before_{timestamp}.sqlite3'
    json_file = out / f'trojanscout_demo_before_{timestamp}.json'
    with sqlite3.connect(path, timeout=15) as db:
        db.row_factory = sqlite3.Row
        rows = [dict(x) for x in db.execute('SELECT * FROM players')]
        if not all(pid in {r['id'] for r in rows} for pid in UPDATES):
            raise SystemExit('SAFETY STOP: expected players missing.')
        with sqlite3.connect(backup_file) as backup:
            db.backup(backup)
        json_file.write_text(json.dumps(rows, indent=2), encoding='utf-8')
        print(f'Backup: {backup_file}')
        print(f'JSON snapshot: {json_file}')
        try:
            db.execute('BEGIN IMMEDIATE')
            for pid, (name, updates) in UPDATES.items():
                columns = ', '.join(f'{key} = ?' for key in updates)
                result = db.execute(f'UPDATE players SET {columns} WHERE id = ? AND name = ?', (*updates.values(), pid, name))
                if result.rowcount != 1:
                    raise ValueError(f'Player {pid} no longer matches. Aborting.')
            db.commit()
        except Exception:
            db.rollback()
            raise
    print(f'SUCCESS: Updated {len(UPDATES)} fictional demo players; other player records unchanged.')
    print('Refresh the frontend and run .\\TrojanScout_MVP_SmokeTest.ps1')


if __name__ == '__main__':
    main()
