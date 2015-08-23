(defpackage :morphology
  (:use :morphology-utils :regexp :utils :cl)
  (:export :wordify))

(defun number? (s)
  (match "^\\(\\(m\\|ng\\?\\)[eiu][eiu]\\?\\)\\+\\(ti\\)\\?$" s))
(defun num-con (s)
  (or (string= s "fuv")
      (string= s "fuetue")))
(defun make-number (l)
  {(:type . :number) (:is . 3) (:ordinal . nil)}) ;TODO
(defun get-numbers (l sofar)
  (if (and (num-con (car l))
           (number? (cadr l)))
      (get-numbers (cddr l) (append sofar (pop l) (pop l)))
    (list l (make-number sofar))))

(defun prep? (s)
  (match "^f[ieu]\\{1,2\\}t[ieu]\\{1,2\\}$" s))
(defun make-prep (s)
  {(:type . :preposition) (:is . (regexp-split "[ft]" s))})

(defun pro? (s)
  (match "^zh[ieu]\\{1,2\\}f[ieu]\\{1,2\\}$" s))
(defun make-pro (s)
  (let* ((l (regexp-split "\\(zh\\|f\\)" s)) (v1 (car l)) (v2 (cadr l)))
    {(:type . :pronoun) (:is . "TODO")})) ;TODO

(defun wordify (sen)
  (let ((l (remove "" (regexp-split "[ -]" (string-downcase sen)))) ret)
    (loop while l do
          (let ((c (pop l)))
            (cond
             ((number? c) (let ((ll (get-numbers l (list c))))
                            (setf l (car ll))
                            (push (cadr ll) ret)))
             ((prep? c) (push (make-prep c) ret))
             ((pro? c) (push (make-pro c) ret))
