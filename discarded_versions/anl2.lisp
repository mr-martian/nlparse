(load "list_regex.lisp")
(defpackage :anl
  (:use :cl :list-regex)
  (:export :wordlist :*gram* :sens))
(in-package :anl)

(defmacro wordlist (&rest lst)
  (let ((g (gensym)))
    `(lambda (,g) (member ,g '(,@lst)))))
(setf *gram* (list 'LOC  '(or l PREP)
		   'PREP '(p NP)
		   'NPs  '((? art) (* ADJP) n (? PREP) (? DEP))
		   'NPc  '(NPs (* NPs) ncon NPs)
		   'NP   '(or NPc NPs QUOT TERM)
		   'DEP  '(dq v NP)
		   'OBJs '(or ADJP NP PREP INF VING QUOT)
		   'OBJc '(OBJs (* OBJs) ncon OBJs)
		   'OBJ  '(or OBJc OBJs DEPv)
		   'INF  '(to v (? PREP))
		   'VING '(ing (? PREP))
		   'VPs  '((? con) (? PREP) NP (* adv) v (? OBJ))
		   'VPsl '((? con) l NP (* adv) v (? OBJ))
		   '--2o '(ncon NP NP)
		   '-2o  '(NP NP (* --2o))
		   'VPs2 '((? con) (? PREP) NP (* adv) 2obj -2o)
		   'ADJP '((? adv) adj)
		   '2Ss  '((? con) (? PREP) (* adv) v (? OBJ))
		   '2Ssl '((? con) l (* adv) v (? OBJ))
		   'SENs '(or VPs2 VPs VPsl)
		   'SS2s '(or SENs 2Ss 2Ssl)
		   '-snc '((? |,|) con SS2s)
		   'SENc '(SENs (* -snc))
		   'SEN  '(or VSUB SENc SENs IMP IMPl IMPd)
		   'QUOT '(|"| SEN |"|)
		   'TERM '(|"| NPs |"|)
		   'IMPl '(v NP v NP) ;Let there be light.
		   'IMPd '(v NP) ;Make light.
		   'IMP  '((or IMPl IMPd) con (or IMPl IMPd))
		   'DEPv '(that NP v OBJ)
		   '-vsb '(which v)
		   'VSUB '((or SENc SENs) |,| (or -vsb ing) NP)
		   'l    (wordlist now then yesterday tomorrow)
		   'adv  (wordlist quickly surely)
		   'q    (wordlist who what where when why how)
		   'dq   (wordlist who where which that)
		   'v    (wordlist punched sang was is created said be let
				   jumped saw separated separate made)
		   '2obj (wordlist called)
		   'ing  (wordlist moving marking)
		   'art  (wordlist a an the)
		   'n    (wordlist song book potato ninja sock soup bog
				   green property beginning God heavens
				   earth shape darkness surface deep
				   spirit water light there he pool day
				   night evening morning expanse midst
				   waters it so)
		   'adj  (wordlist green brown quick soupy browning empty
				   watery good first)
		   'p    (wordlist in on of under through around with without
				   over from above)
		   'ncon (wordlist and or)
		   'con  (wordlist for and nor but or yet so)))
(setf sens '(((In the beginning God created the heavens and the earth) SEN)
	     ((Now the earth was without shape and empty |,|
		   and darkness was over the surface of the watery deep |,|
		   but the Spirit of God was moving over the surface
		   of the water) SEN)
	     ((God said |"| Let there be light |"|) SEN)
	     ((And there was light) SEN)
	     ((God saw that the light was good |,|
		   so God separated the light from the darkness) SEN)
	     ((God called the light |"| day |"|
		   and the darkness |"| night |"|) SEN)
	     ((There was evening |,| and there was morning |,|
		     marking the first day) SEN)
	     ((God said |"| Let there be an expanse
		   in the midst of the waters and let it
		   separate water from water |"|) SEN)
	     ((So God made the expanse and separated the water
		  under the expanse from the water above it) SEN)
	     ((It was so) SEN)
	     ))
(defun outsen (x)
  (format t "~a~%====================~%~%"
	  (match (car x) (cadr x) *gram* :verbose nil)))
(mapcar #'outsen sens)
;(outsen (car (last sens)))
