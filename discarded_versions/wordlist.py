ls = open('todo6.txt').read().splitlines()
for w in ls:
    i = ''
    if True:#w.endswith('ed'):
        print "%s (I %s this %s to %s a potato)" % (w,w,w,w)
        i = raw_input()
    if i:
        f = open('dicts/en/%s.lisp' % w, 'a')
        #f.write('{parsenode ((type . noun) (is %s) (flags :proper t :plural nil) (descs) (other) (remsen)}\n') #fix mismatched parens, add outer parens for list
        #f.write('{parsenode ((type . noun) (is %s) (flags :proper nil :plural nil) (descs) (other) (remsen)}\n')
        #f.write('''{parsenode ((type . noun) (is %s) (flags :proper nil :plural t) (descs) (other) (remsen)}''' % w[:-1])
        #f.write('''{parsenode ((type . verb) (is %s) (flags :single t :tense :present) (descs) (other) (remsen)}\n''' % w[:-1])
        #f.write('{parsenode ((type . adj) (is %s) (flags) (descs) (other) (remsen)}\n' % w)
        #f.write('''{parsenode ((type . verb) (is %s) (flags :tense :pastpart) (descs) (other) (remsen)}{parsenode ((type . verb) (is %s) (flags :tense :past) (descs) (other) (remsen)}''' % (i,i))
        f.write('{parsenode ((type . verb) (is %s) (flags :tense :present :single nil) (descs) (other) (remsen)}' % w)
        f.close()
        f = open('dicts/en/to %s.lisp' % w, 'a')
        f.write('{parsenode ((type . verb) (is to %s) (flags :tense :inf) (descs) (other) (remsen)}' % w)
    else:
        f = open('todo7.txt', 'a')
        f.write(w+'\n')
    f.close()
