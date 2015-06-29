import sys, os
def break_line(line, do_word, is_word, do_line=None):
    if do_line:
        l = do_line(line)
    else:
        l = []
        cl = []
        for w in line.split():
            cl += do_word(w)
            if not is_word(w):
                l.append(cl)
                cl = []
    if cl:
        l.append(cl)
    return l
#wf = []
disc = set()
def do_parse(line, make_dict, max_word, is_word):
    fr = []
    r = [[[], line]]
    while r:
        n = r.pop()
        if n[1]:
            add = False
            rl = []
            for i in xrange(1, min(len(n[1])+1, max_word)):
                if is_word(' '.join(n[1][:i])) or i == 1:
                    for it in make_dict(' '.join(n[1][:i])):
                        rl.append([it, n[1][i:]])
                        add = True
            rr = []
            if not add:
                r.append([n[0], n[1][1:]])
                #f = open('discarded_words.txt', 'a')
                disc.add(n[1][0])
                #try:
                #    f.write(n[1][0].encode('ascii', errors='ignore'))
                #    f.write('\n')
                #except:
                #    wf.append(n[1][0])
                #f.close()
                #for i in r:
                #    if i[1] == n[1]:
                #        rr.append([i[0], i[1][1:]])
                #    else:
                #        rr.append(i)
                #r = rr
                r = [[i[0], i[1][1:]] if i[1] == n[1] else i for i in r]
            else:
                for i in r:
                    if i[1] == n[1]:
                        for p in rl:
                            rr.append([i[0] + [p[0]], p[1]])
                    else:
                        rr.append(i)
                for i in rl:
                    rr.append([n[0] + [i[0]], i[1]])
                r = rr
        else:
            fr.append(n[0])
    return fr
def old_to_lisp(dct):
    t = 'nil'
    i = 'nil'
    f = []
    for k in dct.keys():
        if k == 'type':
            t = dct[k]
        elif k == 'is':
            i = dct[k]
        else:
            f.append('%s %s' % (k, dct[k]))
    return "{parsenode ((type . %s) (is %s) (flags %s) (descs) (other) (remsen))}" % (t, i, ' '.join(f))
def to_lisp(d):
    return "{parsenode ((type . %s) (is %s) (flags %s) (descs) (other) (remsen))}" % \
           (d['type'] if 'type' in d else 'nil', d['is'] if 'is' in d else 'nil', \
            ' '.join(['%s %s' % (n[0], n[1]) for n in d.iteritems() if n[0][0] == ':']))
#import itertools
#dtol = itertools.chain.from_iterable
#def to_lisp(d):
#    return "{parsenode ((type . %s) (is %s) (flags %s) (descs) (other) (remsen))}" % \
#           (d['type'] if 'type' in d else 'nil', d['is'] if 'is' in d else 'nil', \
#            ' '.join(dtol(d.iteritems())))
def main(lang, f1, f2):
    if True: #try:
        f = open(f1)
        lines = f.read().splitlines()
        f.close()
        f = open(f2, 'w')
        f.write('(\n')
        #FILE STRUCTURE: (minus spaces)
        # ( ( (para1 possibility1)
        #     (para1 possibility2)
        #     ... )
        #   ( (para2 possibility1)
        #     (para2 possibility2)
        #     ... )
        #   ... )
        sys.path.append(os.path.dirname(os.path.realpath(__file__)) + '/' + lang)
        import parse
        dl = parse.do_line if 'do_line' in dir(parse) else None
        for l in lines:
            f.write('  (\n    (\n')
            sl = break_line(l.lower(), parse.do_word, parse.is_word, dl)
            for s in sl:
                for p in do_parse(s, parse.make_dict, parse.MAX_WORD_LENGTH, parse.is_word):
                    if p:
                        f.write('      (\n        ' + '\n        '.join([to_lisp(i) for i in p]) + '\n      )\n')
            f.write('\n    )\n  )\n')
        f.write(')')
        f.close()
        #print list(set(wf))
    else: #except:
        print """Proper command line usage:
python parse.py lang infile outfile"""
    f = open('discarded_words.txt', 'w')
    d = list(disc)
    d.sort()
    f.write('\n'.join(d))
    f.close()
if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
