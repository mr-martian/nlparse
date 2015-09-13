(match-fn $noun
          (merge-nodes ;#{parsenode ((type . 'noun) (flags . #@(:art art))
                       ;             (descs . #@(:adj adj :prep prep)))}
                       #< 'noun ~ #@(:art art) #@(:adj adj :prep prep) nil
                       noun)
          (must-find 'noun)
          (n ? #&article art)
          ($ * $adj adj)
          (n 1 #&noun noun)
          ($ ? $prep prep))
(match-fn $adj
          (merge-nodes #{parsenode ((type . 'adj) (descs . #@(:adv adv)))}
                       adj)
          (must-find 'desc)
          (n * #!desc (:verbal t) adv)
          (n 1 #!desc (:verbal t) adj))
(match-fn $prep
          (merge-nodes #!noun (:prep prep) noun)
          (must-find 'preposition 'noun)
          (n 1 #&preposition prep)
          ($ 1 $noun noun))
(match-fn $verse-num
          #{parsenode ((type . 'verse-num) (other . #@(:ch ch :v v)))}
          (must-find 'chapter 'verse)
          (n 1 #&chapter ch)
          (n 1 #&verse v))
(match-fn $para-break
          para
          (n 1 #&~ para))
(match-fn $thing
          (nn a p)
          ($or (($ 1 $noun nn))
               (($ 1 $adj a))
               (($ 1 $prep p))))
(match-fn $thing-comma
          th
          ($ 1 $thing th)
          (n 1 #&comma c))
(match-fn $con-thing
          (merge-nodes #{parsenode ((type . 'conjunction)
                                    (other . #@(:before b1 :just-before b2
                                                      :after a)))}
                       con)
          ($ * $thing-comma b1)
          ($ ? $thing b2)
          (n 1 #!conjunction (:multi t) con)
          ($ 1 $thing a))
(match-fn $anything
          (th cth)
          ($or (($ 1 $thing th))
               (($ 1 $con-thing cth))))
(match-fn $prog
          (merge-nodes ing
                       #!verb (:aspect '(:progressive)
                                       :finite (get-flag cop :finite)
                                       :tense (get-flag cop :tense)
                                       :mood (get-flag cop :mood)))
          (must-find 'aux-verb)
          (n 1 #!aux-verb (:function :copula) cop)
          (n 1 #!verb (:finite nil :participle t :tense :present) ing))
(match-fn $perfect
          (merge-nodes ed
                       #!verb (:aspect (append '(:progressive)
                                               (get-flag ed :aspect))
                                       :finite (get-flag per :finite)
                                       :tense (get-flag per :tense)
                                       :mood (get-flag per :mood)))
          (must-find 'aux-verb)
          (n 1 #!aux-verb (:function :perfective) per)
          (n 1 #!verb (:finite nil :participle t :tense :past) ed))
(match-fn $verb
          v
          ($or ((n 1 #&verb v))
               (($ 1 $prog v))
               (($ 1 $perfect v))))
(match-fn $intrans
          (merge-nodes #{parsenode ((type . 'verb) (descs . #@(:prep p :adv a))
                                    (other . #@(:subject subj)))}
                       ;(when (eq (get-flag v :valency) :intransitive) v))
                       v)
          (must-find #!verb (:valency :intransitive))
          ($ ? $prep p)
          (n ? #!desc (:verbal t) a)
          ($ 1 $anything subj)
          ($ 1 $verb v))
(match-fn $trans
          (merge-nodes #{parsenode ((type . 'verb) (descs . #@(:prep p :adv a))
                                    (other . #@(:subject subj :object obj)))}
                       ;(when (eq (get-flag v :valency) :transitive) v))
                       v)
          (must-find #!verb (:valency :transitive))
          ($ ? $prep p)
          (n ? #!desc (:verbal t) a)
          ($ 1 $anything subj)
          ($ 1 $verb v)
          ;(n 1 #!verb (:mood :indicative :finite t :tense :past :valency :transitive) v)
          ($ 1 $anything obj))
(match-fn $ditrans
          (merge-nodes #{parsenode ((type . 'verb) (descs . #@(:prep p :adv a))
                                    (other . #@(:subject subj :object1 obj1
                                                         :object2 obj2)))}
                       ;(when (eq (get-flag v :valency) :transitive) v))
                       v)
          (must-find #!verb (:valency :ditransitive))
          ($ ? $prep p)
          (n ? #!desc (:verbal t) a)
          ($ 1 $anything subj)
          ($ 1 $verb v)
          ($ 1 $anything obj1)
          ($ 1 $anything obj2))
(match-fn $sen
          s
          ($or (($ 1 $intrans s))
               (($ 1 $trans s))
               (($ 1 $ditrans s))))
(match-fn $sen-comma
          th
          ($ 1 $sen th)
          (n 1 #&comma c))
(match-fn $con-sen
          (merge-nodes #{parsenode ((type . 'conjunction)
                                    (other . #@(:before b1 :just-before b2
                                                        :after a)))}
                       con)
          ($ * $sen-comma b1)
          ($ ? $sen b2)
          (n 1 #!conjunction (:multi t) con)
          ($ 1 $sen a))
(match-fn $anysen
          (th cth)
          ($or (($ 1 $sen th))
               (($ 1 $con-sen cth))))
(match-fn $con-sen-2
          (merge-nodes #{parsenode ((type . 'conjunction)
                                    (other . #@(:before b :after a)))}
                       con)
          ($ ? $anysen b)
          (n 1 #!conjunction (:multi nil) con)
          ($ 1 $anysen a))
(match-fn $punct
          p
          ($or ((n 1 #&period p))
               ((n 1 #&exclamation-point p))))
(match-fn $over-sen
          (merge-nodes #{parsenode ((type . (type s)) (flags . #@(:punct p)))}
                       s)
          ($or (($ 1 $anysen s))
               (($ 1 $con-sen-2 s)))
          ($or ((n 1 #&period p))
               ((n 1 #&exclamation-point p))))
(match-fn $gah!
          #< 'verb (is v) (flags v) #@(:punct pu :prep
                                              #< 'noun (is pn)
                                                  #@(:prep p :art a) nil nil
                                        :adv nil)
                       #@(:subject sn :object
                                   #< 'con c (flags c) nil 
                                      #@(:before #< 'noun (is on1)
                                                      (cons (cons :art a2)
                                                            (flags on1))
                                                 nil nil
                                                 :after #< 'noun (is on2)
                                                         (cons (cons :art a3)
                                                               (flags on1))
                                                 nil nil))
          (n 1 #&preposition p)
          (n 1 #&article a1)
          (n 1 #&noun pn)
          (n 1 #&noun sn)
          (n 1 #&verb v)
          (n 1 #&article a2)
          (n 1 #&noun on1)
          (n 1 #&conjunction c)
          (n 1 #&article a3)
          (n 1 #&noun on2)
          (n 1 #&period pu))
