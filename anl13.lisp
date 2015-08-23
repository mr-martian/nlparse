(load "utils.lisp")
(load "syntax-utils.lisp")
(load "morphology-utils.lisp")
(let ((lang (or (ignore-errors (elt #+clisp ext:*args*
                                    #+sbcl (cdr sb-ext:*posix-argv*)
                                    #-(or clisp sbcl) '(nil)
                                    0))
                "en")))
  (load (format nil "langs/~a/morphology.lisp" lang))
  (load (format nil "langs/~a/syntax.lisp" lang)))
(defpackage :anl
  (:use :syntax :morphology :syntax-utils :morphology-utils :utils :cl))
(in-package :anl)

(defun apply-pats (sen pats &key multi)
  (let ((r (loop for i in (if multi sen (list sen)) collecting
                 (list i (mapcar #'name pats))))
        ret (pat-dict (next-dict (car pats)))) ;just for quicker reference
    (loop while r do
          (let ((l (pop r)))
            (if (cadr l)
                (let ((sn (car l)) (pt (gethash (caadr l) pat-dict))
                      (pr (cdadr l)))
                  (aif ns (match pt sn)
                       (progn
                         (push (list ns (append (next pt) pr)) r)
                         (when (optional pt)
                           (push (list ns pr) r)))
                       (push (list sn pr) r))))
            (push (car l) ret)))
    (remove nil ret)))

(defun parse-sen (s)
  (let ((m (multiple-value-list (wordify s))))
    (apply-pats (car m) pats :multi (cadr m))))
(out (mapcar #'name pats))
(out (remove-duplicates (parse-sen "hh") :test #'n=))
