import os,runpy,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
os.environ['CODEWORLD_HOST']='0.0.0.0'
os.environ['CODEWORLD_PORT']='4173'
os.environ.setdefault('CODEWORLD_DB',str(root.parent/'audit/preview.sqlite3'))
runpy.run_path(str(root/'server.py'),run_name='__main__')
