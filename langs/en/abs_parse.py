#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys, os
sys.path.append(os.path.dirname(os.path.realpath(__file__)) + '/..')
from abstract_parse import *

EnWord = one_lang('en')

noun = EnWord(ls='nouns.txt', dct={'type':'noun', ':countable':'t', ':proper':'nil'})
proper = EnWord(ls='propers.txt', dct={'type':'noun', ':countable':'t', ':proper':'t'})
desc = EnWord(ls='adjectives.txt', dct={'type':'desc'})
intransitive = EnWord(ls='intransitives.txt', dct={'type':'verb', ':valency':':intransitive'})
transitive = EnWord(ls='transitives.txt', dct={'type':'verb', ':valency':':transitive'})
ditransitive = EnWord(ls='ditransitives.txt', dct={'type':'verb', ':valency':':ditransitive'})
talk_verb = EnWord(ls='talk_verbs.txt', dct={'type':'verb', ':valency':':transitive', ':talk':'t'})
irreg_pasts = LitDict({'said':[{'type':'verb', 'is':'say', ':finite':'t', ':tense':':past', ':valency':':transitive', ':mood':':indicative', ':talk':'t'},
                               {'type':'verb', 'is':'say', ':finite':'t', ':tense':':past', ':mood':':participle', ':talk':'t'}],
                       'was':[{'type':'verb', 'is':'is', ':finite':'t', ':tense':':past', ':valency':':transitive', ':mood':':indicative', ':talk':'nil'},
                              {'type':'aux-verb', 'is':'is', ':function':':copula', ':tense':':past', ':mood':':indicative'}],
                       'had':[{'type':'verb', 'is':'have', ':finite':'t', ':tense':':past', ':valency':':transitive', ':mood':':indicative', ':talk':'nil'},
                              {'type':'aux-verb', 'is':'have', ':function':':perfective', ':tense':':past', ':mood':':indicative'}],
                      })
verbs = [intransitive, transitive, ditransitive, talk_verb]

class punct:
    def __init__(self):
        self.pat = re.compile(r'\d+:\d+')
        self.pd = {",": [{"is":"|,|", "type":"comma"}],
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
                   "~": [{"is":"~", "type":"~"}], #paragraph break
                  }
    def parse(self, word):
        if self.pat.match(word):
            return [[{'type':'chapter', 'is':word.split(':')[0]}, {'type':'verse', 'is':word.split(':')[1]}]]
        elif word in self.pd.keys():
            return self.pd[word]
        else:
            return []
class verbPhraseStrip(strip):
    def __call__(self, word):
        l = word.split()
        r = strip.__call__(self, l[0])
        if r:
            return ' '.join([r] + l[1:])
def vsl(l):
    r = []
    for i in l:
        r.append(i)
        r.append(verbPhraseStrip(i))
    return r

pats = [EnWord(dct={':plural':'nil'}, sendto=[noun, proper]),
        EnWord(dct={':plural':'t'}, sendto=[noun, proper],
               strip=[[1], [2, '', '.+([cs]t|s)es$'], [3, 'y', '.+ies$']],
               pat='.+s$'),
        EnWord(dct={':verbal':'nil'}, sendto=desc),
        EnWord(dct={':verbal':'t'}, sendto=desc,
               strip=[[2, 'e'], [1, 'e'], [2], [3, 'y', '.*ily$'], [3, 'ey', '.*ily$'], [1, '', '.*lly$']],
               pat='.*ly$'),
        EnWord(dct=[{':finite':'t', ':mood':':indicative', ':tense':':present'}, {':finite':'t', ':mood':':imperative', ':tense':':present'}],
               sendto=verbs),
        EnWord(dct=[{':finite':'nil', ':participle':'t', ':tense':':past'}, {':finite':'t', ':mood':':indicative', ':tense':':past'}],
               sendto=verbs,
               strip=vsl([[1], [2], [3, 'y', '.*ied'], [3, '', r'.*(.)\1ed$']]),
               pat='.*ed$'),
        EnWord(dct={':finite':'nil', ':participle':'t', ':tense':':present'},
               sendto=verbs,
               strip=vsl([[3], [3, 'e'], [4, '', r'.*(.)\1ing$']]),
               pat='.*ing$'),
        EnWord(dct={':finite':'nil', ':infinitive':'t'},
               sendto=verbs,
               strip=(lambda x: x[3:]),
               pat='^to .*'),
        EnWord(ls='prepositions.txt', dct={'type':'preposition'}),
        EnWord(ls='adverbs.txt', dct={'type':'desc', ':verbal':'t'}),
        Table([['i', 'me', 'my', 'mine', 'myself'],
               ['you', 'you', 'your', 'yours', 'yourself'],
               ['he', 'him', 'his', 'his', 'himself'],
               ['she', 'her', 'her', 'hers', 'herself'],
               ['it', 'it', 'its', 'its', 'itself'],
               ['we', 'us', 'our', 'ours', 'ourselves'],
               ['you', 'you', 'your', 'yours', 'yourselves'],
               ['they', 'them', 'their', 'theirs', 'themselves']],
              [{':case':':nominative'},
               {':case':':accusative'},
               {':case':':genitive'},
               {':case':':accusative', ':possesive':'t'},
               {':case':':accusative', ':reflexive':'t'}],
              [{':person':1, ':plural':'nil'},
               {':person':2, ':plural':'nil'},
               {':person':3, ':plural':'nil', ':gender':':male', ':animate':'t'},
               {':person':3, ':plural':'nil', ':gender':':female', ':animate':'t'},
               {':person':3, ':plural':'nil', ':gender':':neuter', ':animate':'nil'},
               {':person':1, ':plural':'t'},
               {':person':2, ':plural':'t'},
               {':person':3, ':plural':'t'}],
              {'type':'pronoun'}),
        LitDict({'a':{'type':'article', 'is':'a', ':definite':'nil'},
                 'an':{'type':'article', 'is':'a', ':definite':'nil'},
                 'the':{'type':'article', 'is':'the', ':definite':'t'}}),
        EnWord(litls=['that', 'which', 'who', 'whom', 'whose', 'whichever', 'whoever', 'whomever'], dct={'type':'relative-pronoun'}),
        EnWord(litls=['what', 'who', 'which', 'whom', 'whose'], dct={'type':'interrogative-pronoun'}),
        EnWord(litls=['but', 'for', 'if', 'nor', 'so', 'then', 'yet'], dct={'type':'conjunction', ':multi':'nil'}),
        EnWord(litls=['and', 'or'], dct={'type':'conjunction', ':multi':'t'}),
        punct(),
        irreg_pasts,
        EnWord(litls=['it', 'there'], dct={'type':'impersonalizer'}),
       ]

if __name__ == '__main__':
    print noun.parse('soup')
    print pats[0].parse('soup')
    print pats[1].parse('soups')
    print pats[3].parse('green')
