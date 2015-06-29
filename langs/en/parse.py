#!/usr/bin/python
# -*- coding: utf-8 -*-
MAX_WORD_LENGTH = 5 #will get out from under
import os
def load_list(fname):
    f = open(os.path.dirname(os.path.realpath(__file__)) + '/' + fname, 'r')
    l = f.read().splitlines()
    f.close()
    return l
adjectives = load_list('adjectives.txt')
adverbs = load_list('adverbs.txt')
ditransitives = load_list('ditransitives.txt')
intransitives = load_list('intransitives.txt')
nouns = load_list('nouns.txt')
prepositions = load_list('prepositions.txt')
propers = load_list('propers.txt')
transitives = load_list('transitives.txt')
uncountables = load_list('uncountables.txt')
conjunctions = load_list('conjunctions.txt')
"""
Auxiliary verb  Meaning contribution       Example
be1       copula (= linking verb)       She is the boss.
be2       progressive aspect       He is sleeping.
be3       passive voice            They were seen.
can1       deontic modality       I can swim.
can2       epistemic modality       Such things can help.
could1       deontic modality       I could swim.
could2       epistemic modality       That could help.
dare       epistemic modality       How dare you!
do       do-support/emphasis       You did not understand.
have1       perfect aspect       They have understood.
may1       deontic modality       May I stay?
may2       epistemic modality       That may take place.
might       epistemic modality       We might give it a try.
must1       deontic modality       You must not mock me.
must2       epistemic modality       It must have rained.
need       deontic modality       You need not water the grass.
ought       deontic modality       You ought to play well.
shall       deontic modality       You shall not pass.
should1       deontic modality       You should listen.
should2       epistemic modality       That should help.
will       epistemic modality       We will eat pie.
would       epistemic modality       Nothing would accomplish that.
""" #enwiki "Auxilary Verbs"
special = {
    ",": [{"is":"|,|", "type":"comma"}],
    "|,|": [{"is":"|,|", "type":"comma"}],
    ".": [{"is":"|.|", "type":"period"}],
    "|.|": [{"is":"|.|", "type":"period"}],
    "!": [{"is":"!", "type":"exclamation-point"}],
    "?": [{"is":"?", "type":"question-mark"}],
    "(": [{"is":"|(|", "type":"open-paren"}],
    "|(|": [{"is":"|(|", "type":"open-paren"}],
    ")": [{"is":"|)|", "type":"close-paren"}],
    "|)|": [{"is":"|)|", "type":"close-paren"}],
    "'": [{"is":"|'|", "type":"single-quote"}],
    "|'|": [{"is":"|'|", "type":"single-quote"}],
    "\"": [{"is":"|\"|", "type":"double-quote"}],
    "|\"|": [{"is":"|\"|", "type":"double-quote"}],
    "‘": [{"is":"|'|", "type":"single-quote"}],
    "’": [{"is":"|'|", "type":"single-quote"}],
    "“": [{"is":"|\"|", "type":"double-quote"}],
    "”": [{"is":"|\"|", "type":"double-quote"}],
    "–": [{"is":"–", "type":"M-dash"}],
    "a": [{"is":"a", "type":"article", ":definite":"nil"}],
    "an": [{"is":"a", "type":"article", ":definite":"nil"}],
    "awoke": [{"is":"awake", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "became": [{"is":"become", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "born": [{"is":"bear", "type":"verb", ":tense":":past", ":mood":":participle"}],
    "came": [{"is":"come", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "did": [{"is":"do", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "do": [{"is":"do", "type":"verb", ":tense":":present", ":mood":":indicative"},
           {"is":"do", "type":"verb", ":tense":":present", ":mood":":imperative"},
           {"is":"do", "type":"aux-verb", ":tense":":present", ":mood":":imperative"}],
    "gave": [{"is":"give", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "have": [{"is":"have", "type":"verb", ":tense":":present", ":mood":":indicative"}],
    "is": [{"is":"is", "type":"verb", ":tense":":present", ":mood":":indicative"}],
    "mess up": [{"is":"mess up", "type":"verb", ":tense":":present", ":mood":":indicative"}],
    "said": [{"is":"say", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "sang": [{"is":"sing", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "take": [{"is":"take", "type":"verb", ":tense":":present", ":mood":":indicative"},
             {"is":"take", "type":"verb", ":tense":":present", ":mood":":imperative"}],
    "the": [{"is":"the", "type":"article", ":definite":"t"}],
    "to be": [{"is":"is", "type":"verb", ":tense":"nil", ":mood":":infinitive"}],
    "told": [{"is":"tell", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "took": [{"is":"take", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "was": [{"is":"is", "type":"verb", ":tense":":past", ":mood":":indicative"}],
    "will be": [{"is":"is", "type":"verb", ":tense":":future", ":mood":":indicative"}],
}
have_dict = {
    "had": [4, {":tense":":past"}],
    "have": [5, {":tense":":present"}],
}
irregulars = {"wife":"wives", "woman":"women"}
irregularspl = {}
for i in irregulars.keys():
    irregularspl[irregulars[i]] = i
def merge(d1, d2):
    r = d1.copy()
    r.update(d2)
    return r
def with_ly(ls):
    for i in ls:
        if i.endswith('y'):
            yield i[:-1] + 'ily'
            if i.endswith('ey'):
                yield i[:-2] + 'ily'
        elif i.endswith('e'):
            yield i[:-1] + 'ly'
            if i.endswith('le'):
                yield i[:-1] + 'y'
        elif i.endswith('ll'):
            yield i + 'y'
        else:
            pass
        yield i + 'ly'
def do_verb(d):
    l = []
    if d['is'] in intransitives:
        l.append(merge(d, {':valency':':intransitive'}))
    if d['is'] in ditransitives:
        l.append(merge(d, {':valency':':ditransitive'}))
    if d['is'] in transitives:
        l.append(merge(d, {':valency':':transitive'}))
    return [merge(i, {'type':'verb'}) for i in l]
def past(w):
    ret = []
    if w.endswith('ed'):
        di = {':tense':':past', ':mood':':indicative'}
        dp = {':tense':':past', ':mood':':participle'}
        ret += do_verb(merge(di, {'is':w[:-1]}))
        ret += do_verb(merge(dp, {'is':w[:-1]}))
        ret += do_verb(merge(di, {'is':w[:-2]}))
        ret += do_verb(merge(dp, {'is':w[:-2]}))
        if w.endswith('ied'):
            ret += do_verb(merge(di, {'is':w[:-3]+'y'}))
            ret += do_verb(merge(dp, {'is':w[:-3]+'y'}))
        if len(w) >= 4 and w[-3] == w[-4]:
            ret += do_verb(merge(di, {'is':w[:-3]}))
            ret += do_verb(merge(dp, {'is':w[:-3]}))
    return ret
conds = [['', prepositions, 'prep', {}],
         ['', adjectives, 'adj', {}],
         ['', adverbs, 'adv', {}],
         ['', nouns, 'noun', {'plural':'nil', ':countable':'t', ':proper':'nil'}],
         ['', irregulars.keys(), 'noun', {'plural':'nil', ':countable':'t', ':proper':'nil'}],
         ['', uncountables, 'noun', {':countable':'nil', ':proper':'nil'}],
         #['', propers, 'noun', {':plural':'nil', ':countable':'t', ':proper':'t'}],
         ['', [n.lower() for n in propers], 'noun', {':plural':'nil', ':countable':'t', ':proper':'t'}],
         ['', conjunctions, 'con', {}],
         ['', ['that', 'which', 'who', 'whom', 'whose', 'whichever', 'whoever', 'whomever'], 'relative-pronoun', {}],
         ['', ['what', 'who', 'which', 'whom', 'whose'], 'interrogative-pronoun', {}],
         ['ly', list(with_ly(adjectives)), 'adv', {}],
         ['ly', list(with_ly(nouns)), 'adv', {}],
         ['ly', list(with_ly(transitives)), 'adv', {}],
        ]
def do_cond(w, c):
    if w.endswith(c[0]) and w in c[1]:
        return merge({'type':c[2], 'is':w}, c[3])
def make_dict(word):
    w = word.lower()
    ret = []
    for c in conds:
        i = do_cond(w, c)
        if i:
            ret.append(i)
    if w in irregulars.values():
        ret.append({'type':'noun', 'is':irregularspl[w], 'plural':'t', ':countable':'t', ':proper':'nil'})
    if word.istitle():
        wp = word[:-1] if w.endswith('s') else word
        ret.append({'type':'noun', 'is':wp, ':proper':'t', ':plural':('nil' if wp == word else 't')})
    pro_list = [['i', 'me', 'my', 'mine', 'myself'],
                ['you', 'you', 'your', 'yours', 'yourself'],
                ['he', 'him', 'his', 'his', 'himself'],
                ['she', 'her', 'her', 'hers', 'herself'],
                ['it', 'it', 'its', 'its', 'itself'],
                ['we', 'us', 'our', 'ours', 'ourselves'],
                ['you', 'you', 'your', 'yours', 'yourselves'],
                ['they', 'them', 'their', 'theirs', 'themselves']]
    is_pro = False
    for pln, pl in enumerate(pro_list):
        for pn, p in enumerate(pl):
            if w == p:
                d = {'type':'pronoun',
                     'is':p,
                     ':person':str({0:1,1:2,2:3,3:3,4:3,5:1,6:2,7:3}[pln]),
                     ':plural':('t' if pln > 4 else 'nil')}
                d = merge(d, {0: {':case':':nominative'},
                              1: {':case':':accusative'},
                              2: {':case':':genitive'},
                              3: {':case':':accusative', ':possesive':'t'},
                              4: {':case':':accusative', ':reflexive':'t'}}[pn])
                if pln == 2:
                    d[':gender'] = ':male'
                    d[':animate'] = 't'
                elif pln == 3:
                    d[':gender'] = ':female'
                    d[':animate'] = 't'
                elif pln == 4:
                    d[':gender'] = ':neuter'
                    d[':animate'] = 'nil'
                else:
                    pass
                ret.append(d)
                is_pro = True
    if not is_pro:
        if w.endswith('s'):
            ret += do_verb({'is':w[:-1], ":tense":":present", ":mood":":indicative", ":person":"3", ":number":":single"})
            if w.endswith('ies'):
                ret += do_verb({'is':w[:-3]+'y', ":tense":":present", ":mood":":indicative", ":person":"3", ":number":":single"})
                for i in make_dict(word[:-3] + 'y'):
                    if i['type'] == 'noun':
                        i[':plural'] = 't'
                        ret.append(i)
            elif word.endswith('es'):
                for i in make_dict(word[:-2]):
                    if i['type'] == 'noun':
                        i[':plural'] = 't'
                        ret.append(i)
            elif word.endswith("'s"):
                for i in make_dict(word[:-2]):
                    if i['type'] == 'noun':
                        i[':possesive'] = 't'
                        ret.append(i)
            else:
                pass
            for i in make_dict(word[:-1]):
                if i['type'] == 'noun':
                    i[':plural'] = 't'
                    ret.append(i)
        elif word.endswith("s'"):
            for i in make_dict(word[:-2]) + make_dict(word[:-1]):
                if i['type'] == 'noun':
                    i[':possesive'] = 't'
                    ret.append(i)
        elif w.endswith('ing'):
            if make_dict(w[:-3]):
                x = w[:-3]
            elif make_dict(w[:-3] + 'e'):
                x = w[:-3] + 'e'
            elif len(w) >= 5 and w[-4] == w[-5] and make_dict(w[:-4]):
                x = w[:-4]
            else:
                x = ''
            if x:
                ret.append({'is':x, 'type':'verb', ':tense':':present', ':mood':':participle'})
                #ret.append({'is':x, 'type':'adj'})
        else:
            for k in have_dict.keys():
                if w.startswith(k):
                    l = have_dict[k]
                    sl = past(w[l[0]:])
                    for s in sl:
                        if s[':mood'] == ':participle':
                            ret += do_verb(merge(s, {':aspect':':perfect'}))
            if w.startswith('to '):
                ret += do_verb({"is":w[3:], ":tense":"nil", ":mood":":infinitive"})
            elif w.startswith('will '):
                ret += do_verb({'is':w[5:], ":tense":":future", ":mood":":indicative"})
            elif w.startswith('it '):
                for i in make_dict(w[3:]):
                    i[':valency'] = ':impersonal'
                    ret.append(i)
            else:
                ret += do_verb({"is":w, ":tense":":present", ":mood":":indicative"})
                ret += do_verb({"is":w, ":tense":":present", ":mood":":imperative"})
                ret += past(w)
    try:
        ret += special[w]
    except:
        pass
    return [eval(i) for i in list(set([str(x) for x in ret]))]
import re
word = re.compile(r"^[a-z\- ]+?(s'|'(s|t|re|ll|ve))?$")
def is_word(w):
    #return set(w.lower()) <= set("abcdefghijklmnopqrstuvwxyz'- ")
    return word.match(w)
def do_word(word):
    w = word.replace('’', "'").replace('‘', "'").replace('”', '"').replace('“', '"')
    if is_word(w):
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
    #elif '/' in w:
    #    l = ['BEGIN-SLASH']
    #    for i in w.split('/'):
    #        l += do_word[i]
    #    return l + ['END-SLASH']
    else:
        return [w]
