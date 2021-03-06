MAX_WORD_LENGTH = 1 #no compound words
import re
consonants = ['t', 'k', 'p', 'l', 'm', 'n', 'ng', 'f', 'v', 'sh', 'zh']
vowels = ['e', 'i', 'u']
punct = {
    ",": [{"is":"|,|", "type":"comma"}],
    "|,|": [{"is":"|,|", "type":"comma"}],
    ".": [{"is":"|.|", "type":"period"}],
    "|.|": [{"is":"|.|", "type":"period"}],
    "(": [{"is":"|(|", "type":"open-paren"}],
    "|(|": [{"is":"|(|", "type":"open-paren"}],
    ")": [{"is":"|)|", "type":"close-paren"}],
    "|)|": [{"is":"|)|", "type":"close-paren"}],
    "'": [{"is":"|'|", "type":"single-quote"}],
    "|'|": [{"is":"|'|", "type":"single-quote"}],
    "\"": [{"is":"|\"|", "type":"double-quote"}],
    "|\"|": [{"is":"|\"|", "type":"double-quote"}],
    }
special = {
    "ngizh": [{"is":"ngizh", "type":"relative-pronoun"}], #is the only relative pronoun
    "fuv": [{"is":"fuv", "type":"conjunction"}],
    "vif": [{"is":"vif", "type":"conjunction"}],
    "teng": [{"is":"teng", "type":"conjunction"}],
    "shuzh": [{"is":"shuzh", "type":"conjunction"}],
    "feng": [{"is":"feng", "type":"conjunction"}],
    "engi": [{"is":"engi", "type":"cond-conjunction"}],
    "ngung": [{"is":"ngung", "type":"conjunction"}],
    "tef": [{"is":"tef", "type":"comp-more"}],
    "engu": [{"is":"engu", "type":"comp-than"}],
    "u": [{"is":"futu", "type":"prep"}],
    }
def is_word(w):
    return set(w.lower()) <= set(''.join(consonants + vowels))
def chop(word):
    if not word:
        return []
    elif word[0] in consonants or word[0] in vowels:
        return [word[0]] + chop(word[1:])
    elif word[:2] in consonants:
        return [word[:2]] + chop(word[2:])
    else:
        return []
def do_word(word):
    if is_word(word):
        return [chop(word)]
    elif is_word(word[0]):
        return [word[0]] + do_word(word[1:])
    elif is_word(word[-1]):
        return do_word(word[:-1]) + [word[-1]]
    else:
        return []
def parse_number(ls): #handle further complexities in Lisp
    d = ['u', 'e', 'ue', 'iu', 'eu', 'ui', 'i', 'ie', 'ei']
    b = ['m', 'ng', 'n']
    p = []
    next = True
    for i in xrange(len(ls)):
        if next:
            if i+1 < len(ls) and ls[i] in d and ls[i+1] in d:
                p.append(ls[i]+ls[i+1])
                next = False
            else:
                p.append(ls[i])
        else:
            next = False
    n = 0
    isord = 'nil'
    if p[-2:] == ['t', 'i']:
        p.pop()
        p.pop()
        isord = 't'
    try:
        for i in xrange(0, len(p), 2):
            n += 9**(b.index(p[i])) * d.index(p[i+1])
        return {"is":"%s" % n, "type":"number", "ordinal":isord}
    except:
        return False
num = re.compile('((m|ng|n)(u|e|ue|iu|eu|ui|i|ie|ei))+(ti)?')
pats = [
    [['f', vowels, 't', vowels], {"type":"prep"}],
]
def match_ls(pat, word):
    for p, w in zip(pat, word):
        if type(p) == list and w not in p:
            return False
        elif type p == str and w != p:
            return False
        else:
            pass
    return True
def make_dict(word):
    if type(word) == str:
        return punct[word]
    else:
        w = ''.join(word)
        ret = []
        if w in cons:
            ret = cons[w]
        elif num.match(w):
            ret.append(parse_number(word))
        else:
            for k in pats:
                if match(pats[k][0], word):
                    for d in pats[k][1:]:
                        r = d.copy()
                        r.['is'] = w
                        ret.append(r)
                    break
        return ret
