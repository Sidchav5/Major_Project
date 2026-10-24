import json
import os

out = []
for nb_name in ['NB1.ipynb', 'Nb2.ipynb', 'Nb3.ipynb']:
    path = os.path.join('notebooks', nb_name)
    if not os.path.exists(path):
        continue
    out.append(f"==================== {nb_name} ====================")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    cells = data.get('cells', [])
    for idx, cell in enumerate(cells):
        src = "".join(cell.get('source', []))
        ctype = cell.get('cell_type')
        out.append(f"--- {nb_name} Cell {idx} ({ctype}) ---")
        out.append(src)
        out.append("\n" + "="*40 + "\n")

with open('notebook_dump.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("Dumped notebook content to notebook_dump.txt")
