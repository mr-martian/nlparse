(load "cas/match.lisp")
(defpackage :nlparse
  (:use :common-lisp)
  (:import-from :match :if-match :ifmc))
(in-package :nlparse)

(defconstant *flags* '((adj . ((:parenthetical . (t
						  nil))))
		       (adv . ((:parenthetical . (t
						  nil))))
		       (prep .((:parenthetical . (t
						  nil))))
		       (pronoun . ((:hidden . (t
					       nil))
				   (:number . (1
					       :not1))
				   (:parenthetical . (t
						      nil))))
		       (noun . ((:article . (:a
					     :the))
				(:number . (1
					    :not1))
				(:possesive . (t
					       nil))
				(:name . (t
					  nil))
				(:parenthetical . (t
						   nil))))
		       (verb . ((:tense . (:past
					   :present
					   :future
					   :inf))
				(:clause . (:that
					    :where))
				(:mode . (:q?
					  :do!
					  :is.))
				(:parenthetical . (t
						   nil))))
		       (con . ((:parenthetical . (t
						  nil))
			       (:hidden . (t
					   nil))))))
(defconstant *words* '(("I" . (pronoun "I" ((:number . 1)) ()))
		       ("am" . (verb "is" ((:tense . :present)) ()))
		       ("green" . (adj "green" () ()))))
(defconstant *adjs* '("green" "blue" "purple"))

(defmacro letif (n l yes &body no)
  `(let ((,n ,l))
     (if ,n
	 ,yes
       (progn ,@no))))
(defun split-by-one-space (string) ;from cl-cookbook
    "Returns a list of substrings of string
divided by ONE space each.
Note: Two consecutive spaces will be seen as
if there were an empty string between them."
    (loop for i = 0 then (1+ j)
          as j = (position #\Space string :start i)
          collect (subseq string i j)
          while j))
(defun parse (ls)
  (dolist (f '(parse-adj
	       parse-adv
	       parse-prep
	       parse-pronoun
	       parse-noun
	       parse-verb
	       parse-con))
    (letif a (funcall f ls)
	   (return a)
	   nil)))
(defun first-parse (ls &optional i)
  (when (<= (or i 1) (length ls))
    (let ((l (subseq ls 0 (or i 1))))
      (unless (equal l ls)
	(letif r (parse l)
	       (list r (or i 1))
	       (first-parse ls (1+ i)))))))
(defun list-map-parse (ls &optional min)
  (letif results (first-parse ls (or min 1))
	 (if (= (cadr results) (length ls))
	     (car results)
	   (letif r2 (list-map-parse (subseq ls (cadr results)))
		  (cons (car results) r2)
		  (list-map-parse ls (1+ (cadr results)))))
	 nil))
(defun is-adj (w)
  (member w *adjs* :test #'string=))
(defun get-adj (w &optional stuff)
  (if (is-adj w)
      (list 'adj w () stuff)
    nil))
(defun parse-adj (ls)
  (if (= (length ls) 1)
      (get-adj (car ls))
    (when (is-adj (car (last ls)))
      (let ((r (list-map-parse (butlast ls))))
	(if r
	    (get-adj (last ls) r)
	  nil)))))
(defun get-adv (w &optional stuff)
  (list 'adv w () stuff))
(defun parse-adv (ls)
  nil)
(defun get-prep (w &optional stuff)
  (list 'prep w () stuff))
(defun parse-prep (ls)
  nil)
(defun get-pronoun (w &optional stuff)
  (list 'pronoun w () stuff))
(defun parse-pronoun (ls)
  nil)
(defun get-noun (w &optional stuff)
  (list 'noun w () stuff))
(defun parse-noun (ls)
  nil)
(defun get-verb (w &optional stuff)
  (list 'verb w () stuff))
(defun parse-verb (ls)
  nil)
(defun is-con (w)
  (member w '("for" "and" "nor" "but" "or" "yet" "so") :test #'string=))
(defun get-con (w &key flags stuff)
  (list 'con w flags stuff))
(defun parse-con (ls)
  (labels ((pc (ls n)
	       (when (<= n (length ls))
		 (letif p (first-parse ls n)
			(if (string= (nth (cadr p) ls) ",")
			    (letif r (subseq ls (1+ (cadr p)))
				   (if (is-con (car r))
				       (letif l (parse (cdr r))
					      (append (get-con (car r))
						      (list (list (car p) l)))
					      (pc ls (1+ (cadr p))))
				     (letif r2 (pc r 1)
					    (progn
					      (push (car p) (nth 4 r2))
					      r2)
					    (pc ls (1+ (cadr p)))))
				   (pc ls (1+ (cadr p))))
			  (if (is-con (nth (cadr p) ls))
			      (letif last (parse (subseq ls (1+ (cadr p))))
				     (append (get-con (nth (cadr p) ls))
					     (list (list (car p) last)))
				     (pc ls (1+ (cadr p))))
			    (if (eq (nth (cadr p) ls) nil)
				(append (get-con "and" :flags '((:hidden . t)))
					(list (list (car p))))
			      (pc ls (1+ (cadr p))))))))))
	  (pc ls 1)))
(defun listify (str)
  '(1 2 3)) ;e.g. "Hello, I am Daniel." => ("hello" "," "I" "am" "Daniel" ".")
