"""
Renders a single Pug template once for each item in a JSON list.

The JSON list is retrieved from the first (preferably only) key in the provided JSON object.
"""

from functools import reduce
import json
import operator
import os
import sys
import subprocess
from threading import Thread

TMP_FILENAME_BASE = f'{__file__}.tmp'

def render(obj, idx):
    try:
        get_out_filename = lambda:      f"{template_file_base}_{idx}" if not output_filename_keys \
                                   else reduce(operator.getitem, output_filename_keys, obj)
        TMP_FILENAME = f"{TMP_FILENAME_BASE}-{idx}"
        EXT = f'tmp-{idx}'

        with open(TMP_FILENAME, 'w', encoding='utf-8') as tmp:
            json.dump(obj, tmp)

        dir_render_to = basedir if basedir is not None else output_dir
        dir_move_to = output_dir
        cmd = ['pug', template_file, '-o', dir_render_to, '-O', TMP_FILENAME, '-E', EXT]
        initial_name = f'{dir_render_to}/{template_file_base}.{EXT}'
        final_name = f'{dir_move_to}/{get_out_filename()}.html'
        print(f'Rendering {initial_name} from template {template_file}')
        proc = subprocess.run(cmd, capture_output=True, check=True, shell=True)
        print(f'Rendered {initial_name}')
        os.replace(initial_name, final_name)
        print(f'Renamed {initial_name} to {final_name}')
    except subprocess.CalledProcessError as e:
        print(f'Error running command: {e.cmd}')
        print(e.stderr.decode())

    # Clean up this thread's temp file
    if os.path.exists(TMP_FILENAME):
        os.remove(TMP_FILENAME)

if len(sys.argv) < 2:
    print(f"""
Usage:
    python {__file__} template json_file [output_dir] [output_filename_keys] [basedir] [count]

    template             - File path to Pug template file
    json_file            - File path to JSON options data file
    output_dir           - (Optional) Directory to which to render output files. Default: 'rendered'.
    output_filename_keys - (Optional) Property of each object in JSON to use to determine each file's rendered filename.
                           For nested properties, separate each with periods. (e.g. 'this.that.other')
                           If omitted, simply appends an index to each rendered filename.
    basedir              - (Optional) Passed directly to Pug invocation. Path used as root directory to resolve absolute includes.
                           Templates are rendered to this location first before being moved to output_dir.
    count                - (Optional) Maximum number of items to render. If ommitted or <= 0, all items are processed.
""")
    exit(1)

template_file = sys.argv[1]
template_file_base = os.path.splitext(os.path.basename(template_file))[0]
json_file = sys.argv[2]
output_dir = sys.argv[3] if len(sys.argv) > 3 else 'rendered'
output_filename_keys = sys.argv[4].split('.') if len(sys.argv) > 4 else None
basedir = sys.argv[5] if len(sys.argv) > 5 else None
count = int(sys.argv[6]) if len(sys.argv) > 6 else 0

# Load JSON
data = None
try:
    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)
        data = data[list(data.keys())[0]]
except Exception as e:
    print('Error loading JSON:')
    print(e)
    exit(1)

# Ensure target directory exists
# If not, create it
if not os.path.exists(output_dir):
    try:
        os.mkdir(output_dir)
    except Exception as e:
        print('Error creating output directory:')
        print(e)
        exit(1)

# For each item in JSON, render template
rendered = 0
threads = []
for obj in data:
    threads.append(Thread(target=render, args=(obj, rendered)))
    threads[-1].start()
    rendered += 1
    if rendered >= count and count > 0:
        break
for t in threads:
    t.join()
