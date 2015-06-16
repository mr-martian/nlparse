(defpackage :anl-tag
  (:use :cl)
  (:export :tag-sen))
(in-package :anl-tag)

(setf *word-types* '(adj adv art con con+ desc ing loc noun-1 noun+ part prep
			 pro punc verb-f verb-imp verb-inf verb-pa verb-pr))
(setf *words*
      '(adj (empty formless green quick soft watery wet)
	adv (quickly)
	art (a an the)
	con (but for nor so yet)
	con+ (and or)
	desc (very)
	ing (greening hovering moving singing)
	loc (now then)
	noun-1 (beginning darkness deep earth God green light member
			  shape soup spirit surface water)
	noun+ (heavens soups)
	part (be)
	prep (above in of on out over to under up without)
	pro (he her him I it me that them there they us we)
	punc (|'| |"|)
	verb-f ((will sing))
	verb-imp (let make sing)
	verb-inf ((to sing))
	verb-pa (created got (got out of) looked (looked up) said
			 wanted was were)
	verb-pr (are create creates get (get out of) is jump sweep want wants)))
(defun do-one (sen)
  (remove nil
	  (loop for wt in *word-types* appending
		(loop for w in (getf *words* wt) collecting
		      (if (symbolp w)
			  (when (eq w (car sen))
			    (list (list wt w) (cdr sen)))
			(when (and (>= (length sen) (length w))
				   (equal w (subseq sen 0 (length w))))
			  (list (list wt w) (subseq sen (length w)))))))))
(defun tag-sen (sen)
  (let ((l (do-one (mapcar (lambda (x) (intern (format nil "~a" x))) sen))) (r nil))
    (loop while l do
	  (let ((s (pop l)))
	    (if (cadr s)
		(let ((pl (do-one (cadr s))))
		  (when pl
		    (loop for p in pl do
			  (push (list (append (if (symbolp (caar s))
						  (list (car s))
						(car s))
					      (list (car p)))
				      (cadr p))
				l))))
	      (push (car s) r))))
    r))
