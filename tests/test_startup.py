"""Exercise startup with the legacy Windows default text encoding."""
import os
from pathlib import Path
import subprocess
import sys
import textwrap
import unittest


class StartupEncodingTests(unittest.TestCase):
    def test_server_and_lessons_with_cp1252_default(self):
        root = Path(__file__).resolve().parents[1]
        script = textwrap.dedent('''
            import json
            from pathlib import Path
            import tempfile
            import threading
            import urllib.request
            from unittest.mock import patch

            # Path.open/read_text use io.text_encoding to resolve an omitted
            # encoding. Explicit encodings remain unchanged, as on Windows.
            with patch('io.text_encoding', side_effect=lambda encoding, *args:
                       'cp1252' if encoding is None else encoding):
                import server
                import training

                class Quiet(server.Handler):
                    def log_message(self, *args):
                        pass

                with tempfile.TemporaryDirectory() as temporary:
                    server.DB = Path(temporary) / 'players.sqlite3'
                    with server.connection():
                        pass
                    with server.ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as http:
                        thread = threading.Thread(target=http.serve_forever, daemon=True)
                        thread.start()
                        try:
                            url = f'http://127.0.0.1:{http.server_port}'
                            with urllib.request.urlopen(url + '/api/health', timeout=5) as response:
                                assert response.status == 200
                                health = json.load(response)
                                assert health['ok'] and health['version'] == '9.0.1'
                            with urllib.request.urlopen(url + '/api/content', timeout=5) as response:
                                content = json.load(response)
                            assert content['courses'] == training.public_courses()
                            assert len(content['courses']) == 6
                            assert sum(len(course['modules']) for course in content['courses']) == 54
                            html = next(course for course in content['courses'] if course['id'] == 'html')
                            assert html['modules'][7]['title'] == 'Formulários com rótulos'
                        finally:
                            http.shutdown()
                            thread.join(timeout=5)
        ''')
        environment = dict(os.environ, PYTHONUTF8='0', PYTHONIOENCODING='utf-8')
        result = subprocess.run(
            [sys.executable, '-c', script], cwd=root, env=environment,
            capture_output=True, text=True, encoding='utf-8', timeout=20,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
