"""Convenience launcher; uses the same server and real account database."""
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import webbrowser

def main():
    if sys.version_info<(3,10):
        print('Instale Python 3.10 ou superior e tente novamente.');return 1
    root=Path(__file__).resolve().parent
    port=int(os.getenv('CODEWORLD_PORT','8000'))
    url=f'http://127.0.0.1:{port}/'
    process=subprocess.Popen([sys.executable,'server.py'],cwd=root)
    try:
        for _ in range(40):
            if process.poll() is not None:return process.returncode
            try:
                with urllib.request.urlopen(url+'api/health',timeout=.5) as r:
                    if r.status==200:webbrowser.open(url);break
            except OSError:time.sleep(.15)
        print('\nDeixe esta janela aberta. Para encerrar, pressione Ctrl+C.\n'+url)
        return process.wait()
    except KeyboardInterrupt:
        process.terminate()
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:process.kill()
        return 0

if __name__=='__main__':raise SystemExit(main())
