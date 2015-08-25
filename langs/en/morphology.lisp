(defpackage :morphology
  (:use :morphology-utils :utils :cl)
  (:export :wordify))
(in-package :morphology)

;;pats
(load-ls noun "en" "nouns.txt"
         {(:type . :noun) (:countable . t) (:proper) (:lang . :en)})
(load-ls proper "en" "propers.txt"
         {(:type . :noun) (:countable . t) (:proper . t) (:lang . :en)})
(load-ls adj "en" "adjectives.txt" {(:type . :desc) (:verbal) (:lang . :en)})
(load-ls adv "en" "adverbs.txt" {(:type . :desc) (:verbal . t) (:lang . :en)})
(load-ls prep "en" "prepositions.txt" {(:type . :preposition) (:lang . :en)})
(load-ls intransitive "en" "intransitives.txt"
         {(:type . :verb) (:valency . :intransitive) (:talk) (:lang . :en)
          (:mood . :indicative) (:tense . :present) (:finite . t) (:impersonal)})
(load-ls transitive "en" "transitives.txt"
         {(:type . :verb) (:valency . :transitive) (:talk) (:lang . :en)
          (:mood . :indicative) (:tense . :present) (:finite . t) (:impersonal)})
(load-ls ditransitive "en" "ditransitives.txt"
         {(:type . :verb) (:valency . :ditransitive) (:talk) (:lang . :en)
          (:mood . :indicative) (:tense . :present) (:finite . t) (:impersonal)})
(load-ls talk-verb "en" "talk_verbs.txt"
         {(:type . :verb) (:valency . :transitive) (:talk . t) (:lang . :en)
          (:mood . :indicative) (:tense . :present) (:finite . t) (:impersonal)})
;(setf verbs '(intransitive transitive ditransitive talk-verb))
(send verbs (intransitive transitive ditransitive talk-verb))

(lit-dict punct {("," . {(:is . :comma)})
                 ("." . {(:is . :period)})
                 ("!" . {(:is . :exclamation-point)})
                 ("?" . {(:is . :question-mark)})
                 ("(" . {(:is . :open-paren)})
                 (")" . {(:is . :close-paren)})
                 ("'" . ({(:is . :open-single-quote)}
                         {(:is . :close-single-quote)}))
                 ("‘" . {(:is . :open-single-quote)})
                 ("’" . {(:is . :close-single-quote)})
                 ("\"" . ({(:is . :open-double-quote)}
                          {(:is . :close-double-quote)}))
                 ("“" . {(:is . :open-double-quote)})
                 ("”" . {(:is . :close-double-quote)})
                 ("–" . {(:is . :m-dash)})}
          (:type . :punct))
(lit-dict articles {("a" . {(:is . "a") (:definite)})
                    ("an" . {(:is . "a") (:definite)})
                    ("the" . {(:is . "the") (:definite . t)})}
          (:type . :article))

(send singular-noun (noun proper) (:plural . nil))
(send plural-noun (noun proper) (:plural . t))
(strip-send plural1 1 "" ".+s$" plural-noun)
(strip-send plural2 2 "" ".+([cs]t|s)es$" plural-noun)
(strip-send plural3 3 "y" ".+ies$" plural-noun)

(send adverb adj (:verbal . t))
(strip-send adv1 2 "e" ".+ly$" adverb)
(strip-send adv2 1 "e" ".+ly$" adverb)
(strip-send adv3 2 "" ".+ly$" adverb)
(strip-send adv4 3 "y" ".+ily$" adverb)
(strip-send adv5 3 "ey" ".+ily$" adverb)
(strip-send adv6 1 "" ".+lly$" adverb)

(strip-send imperative 0 "" ".*" verbs (:finite . t) (:mood . :imperative))

(send past verbs (:tense . :past))
(send past-part verbs (:tense . :past) (:finite) (:participle . t))
(strip-send past1 1 "" ".+ed$" (past past-part))
(strip-send past2 2 "" ".+ed$" (past past-part))
(strip-send past3 3 "y" ".+ied" (past past-part))
(strip-send past4 3 "" ".+(.)\1ed$" (past past-part))

(send pres-part verb (:tense . :present) (:finite) (:participle . t))
(strip-send pres1 3 "" ".+ing$" pres-part)
(strip-send pres2 3 "e" ".+ing$" pres-part)
(strip-send pres3 4 "" ".+(.)\1ing$" pres-part)


;;end pats

(defun wordify (sen)
  (values (list
           (list {(:type . :noun) (:is . "potato") (:plural . nil)})
           (list {(:type . :preposition) (:is . "in")})
           (list {(:type . :article) (:is . "the")})
           (list {(:type . :desc) (:is . "green") (:verbal . nil)})
           (list {(:type . :noun) (:is . "yard")}))
          nil))

(western-script-parser wordify- *pats* "!(),.?‘’“”'\"" )
                       ;:contractions t :contraction-func (constantly nil))
