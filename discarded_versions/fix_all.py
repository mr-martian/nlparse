import os
for w in os.listdir('dicts/en'):
    f = open('dicts/en' + w, 'r')
    t = f.read()
    f.close()
    t.replace('\n', '')
    t.replace('}', ')}\n')
    f = open('dicts/en' + w, 'w')
    f.write(t)
    f.close()
