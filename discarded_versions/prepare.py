import prepositions, nouns, verbs, adjectives
def do_word(w):
    if set(w.lower()) <= set("abcdefghijklmnopqrstuvwxyz'-"):
        return [w]
    elif w[-1] in ':!.\'",?;)':
        return do_word(w[:-1]) + [w[-1]]
    elif w[0] in '(\'"':
        return [w[0]] + do_word(w[1:])
    #elif '-' in w:
    #    l = ['BEGIN-DASH']
    #    for i in w.split('-'):
    #        l += do_word[i]
    #    return l + ['END-DASH']
    elif '/' in w:
        l = ['BEGIN-SLASH']
        for i in w.split('/'):
            l += do_word[i]
        return l + ['END-SLASH']
    else:
        return [w]
def parse(line):
    l = []
    for w in line.split():
        l += do_word(w)
    fr = []
    r = [[[], l]]
    while r:
        n = r.pop()
        if n[1]:
            add = False
            for i in xrange(1,len(n[1])+1):
                for mod in [nouns, prepositions, verbs, adjectives]:
                    m = mod.tolisp(' '.join(n[1][:i]))
                    if type(m) == str:
                        r.append([n[0] + [m], n[1][i:]])
                        add = True
                    elif type(m) == list:
                        for it in m:
                            r.append([n[0] + [it], n[1][i:]])
                        add = True
                    else:
                        pass
            if not add:
                r.append([n[0], n[1][1:]])
                f = open('discarded_words.txt', 'a')
                f.write(n[1][0])
                f.close()
        else:
            fr.append('(' + '\n'.join(n[0]) + ')')
    return fr
if __name__ == '__main__':
    import sys
    f = open(sys.argv[1])
    lines = f.read().splitlines()
    f.close()
    f = open(sys.argv[2], 'w')
    f.write('(')
    #FILE STRUCTURE: (minus spaces)
    # ( ( (para1 possibility1)
    #     (para1 possibility2)
    #     ... )
    #   ( (para2 possibility1)
    #     (para2 possibility2)
    #     ... )
    #   ... )
    for l in lines:
        f.write('(' + '\n'.join(parse(l.lower())) + ')\n')
    f.write(')')
    f.close()
