import re
with open('error_log.html', 'r', encoding='utf-8') as f:
    text = f.read()

frames = re.findall(r'<span class="fname">(.*?)</span>, line (\d+), in (.*?)\n.*?<div class="context">\n(.*?)\n</div>', text, re.IGNORECASE | re.DOTALL)
for f in frames:
    if 'views.py' in f[0] or 'middleware.py' in f[0] or 'models.py' in f[0]:
        print(f"File {f[0]}, line {f[1]}, in {f[2]}")
        # print some context
        lines = f[3].split('\n')
        for l in lines:
            if 'class="highlight"' in l:
                print(">>>", l.strip())
