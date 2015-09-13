import os, re, sys
def load_list(lang, fname):
    l = []
    if fname:
        f = open(os.path.dirname(os.path.realpath(__file__)) + '/' + lang + '/' + fname, 'r')
        l = f.read().splitlines()
        f.close()
    return l
def mkls(t):
    if t == None:
        return []
    elif isinstance(t, list):
        return t
    else:
        return [t]
class strip:
    def __init__(self, ls):
        self.upto = ls[0]
        self.plus = ls[1] if len(ls) > 1 else ''
        self.pat = re.compile(ls[2]) if len(ls) > 2 else re.compile('.*')
        #if len(ls) > 1:
        #    self.plus = ls[1]
        #    if len(ls) > 2:
        #        self.pat = re.compile(ls[2])
        #    else:
        #        self.pat = re.compile('.*')
        #else:
        #    self.plus = ''
        #    self.pat = re.compile
    def __call__(self, s):
        if self.pat.match(s):
            return s[:-self.upto] + self.plus
class stripDict:
    def __init__(self, dct):
        self.dct = dct
    def __call__(self, s):
        if s in self.dct:
            return self.dct[s]
def mklam(l):
    if hasattr(l, '__call__'):
        return l
    elif isinstance(l, dict):
        return stripDict(l)
    elif isinstance(l, list):
        return strip(l)
    else:
        return lambda x: x
def merge(d1, d2):
    #print "merge(%s, %s)" % (d1, d2)
    r = d1.copy()
    r.update(d2)
    return r
class WordPat:
    def __init__(self, lang, ls=None, litls=[], pat=None, dct={}, strip=None, sendto=None):
        self.ls = self.__chop_list(load_list(lang, ls) + litls)
        self.pat = [re.compile(p) for p in mkls(pat)] if pat else [re.compile('.*')]
        self.dct = mkls(dct)
        self.strip = [mklam(x) for x in (mkls(strip) or [lambda x: x])]
        self.sendto = mkls(sendto)
    def __chop_list(self, ls):
        #print "chop_list(%s)" % ls
        d = {}
        for i in ls:
            if i[0] in d:
                d[i[0]].append(i)
            else:
                d[i[0]] = [i]
        return d
    def __dicttodict(self, d):
        #print "dict-to-dict(%s)" % d
        return [merge(x, d) for x in self.dct]
    def __strtodict(self, word):
        #print "str-to-dict(%s)" % word
        return self.__dicttodict({'is':word})
    def __get_word(self, word):
        #print "get_word(%s)" % word
        if word[0] in self.ls and word in self.ls[word[0]]:
            return self.__strtodict(word)
        else:
            return []
    def parse(self, word):
        #print "parse(%s)" % word
        if not word:
            return []
        elif self.ls:
            return self.__get_word(word)
        elif self.pat:
            if any([x.match(word) for x in self.pat]):
                return self.__do_pat(word)
            else:
                return []
        else:
            return []
    def __do_pat(self, word):
        #print "do_pat(%s)" % word
        if self.sendto:
            #r = []
            #for se in self.sendto:
            #    for st in self.strip:
            #        for l in se.parse(st(word)):
            #            for d in l:
            #                r.append(self.__dicttodict(d))
            #return  r
            #return [self.__dicttodict(d) for d in se.parse(st(word)) for se in self.sendto for st in self.strip]
            #return [self.__dicttodict(d) for d in [se.parse(st(word)) for se in self.sendto for st in self.strip]]
            r = []
            for se, st in [(e,t) for e in self.sendto for t in self.strip]:
                [r.extend(self.__dicttodict(w)) for w in se.parse(st(word))]
            return r
        else:
            return [self.__strtodict(st(word)) for st in self.strip]
class Table:
    def __init__(self, table, across, down, merge={}):
        self.table = table
        self.across = [mkls(x) for x in across]
        self.down = [mkls(x) for x in down]
        self.merge = merge
    def parse(self, word):
        di = merge({'is':word}, self.merge)
        r = []
        if word:
            for d, l in enumerate(self.table):
                for a, w in enumerate(l):
                    if w == word:
                        r += [merge(di, merge(da, dd)) for da in self.across[a] for dd in self.down[d]]
        return r
class LitDict:
    def __init__(self, dct):
        self.dct = dct
    def parse(self, word):
        if word in self.dct:
            return mkls(self.dct[word])
        else:
            return []
def one_lang(lang):
    class lng(WordPat):
        def __init__(self, **kwargs):
            WordPat.__init__(self, lang, **kwargs)
    return lng
def load_lang(lang):
    sys.path.append(os.path.dirname(os.path.realpath(__file__)) + '/' + lang)
    import abs_parse
    return abs_parse.pats
def parse(pats, word):
    l = []
    for i in pats:
        l += i.parse(word)
    return l
if __name__ == '__main__':
    p = load_lang('en')
    print parse(p, 'soup')
    print parse(p, 'silly')
    print parse(p, 'quickly')
    print parse(p, 'whose')
