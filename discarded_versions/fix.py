import os
for i in os.listdir('dicts/en'):
    f = open('dicts/en/' + i, 'r')
    s = f.read()
    f.close()
    f = open('dicts/en/' + i, 'w')
    f.write(s % i.split('.')[0])
    f.close()
