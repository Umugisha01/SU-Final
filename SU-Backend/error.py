import re
with open('error_log.html', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'<pre class="exception_value">(.*?)</pre>', text, re.IGNORECASE | re.DOTALL)
if m: print('Exception Value:', m.group(1).strip())

m2 = re.search(r'Exception Location:.*?<td>(.*?)</td>', text, re.IGNORECASE | re.DOTALL)
if m2: print('Exception Location:', m2.group(1).strip())
