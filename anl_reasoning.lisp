(load "anl2.lisp")
(defpackage :reason
  (:use :cl :anl))
(in-package :reason)
(defconstant *accuracies* '(:true :probably :maybe :possibly :false))
;in order of "truthiness"
;:true      "all _ are _"
;:probably  "most _ are _"
;:maybe     "many _ are _"
;:possibly  "some _ are _"
;:false     "no _ are _"

;object form: ([identifier] ([ises]*) ([properties]*) ([subjects]*) ([objects]*))
;;;identifier: symbol
;;;ises: (symbol truth-value [context]*)
;;;properties: (symbol truth-value [context]*)
;;;subjects: simplified parse trees where [identifier] is the subject
;;;objects: simplified parse trees where [identifier] is the object
;conditional: (implies [if] [then])
;;;if: simplified parse tree
;;;then: simplified parse tree

(defvar *things* '())
