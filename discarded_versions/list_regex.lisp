(defpackage :list-regex
  (:use :cl)
  (:export :match :match-single :match-? :match-* :match-or))
(in-package :list-regex)

(defmacro defmatch (name fn var &body body)
  `(defun ,name (lst pat pat-alist &key (verbose nil) (indent ""))
     (when verbose (format t "~a(~a ~a ~a)~%" indent ',name lst pat))
     (flet ((match-fn (l p) (,fn l p pat-alist :verbose verbose
				 :indent (concatenate 'string indent "+="))))
	   ,(if var
		`(let ((,var (match-fn lst pat)))
		   ,@body)
	      `(progn ,@body)))))
(defmacro letif (var form yes &optional no)
  `(let ((,var ,form)) (if ,var ,yes ,no)))
(define-symbol-macro null-return `((,pat nil) ,lst))
(define-symbol-macro car-return `((,pat ,(car lst)) ,(cdr lst)))
(defmatch match-single match nil
  (when lst
    (letif g (getf pat-alist pat)
	   (if (functionp g)
	       (when (funcall g (car lst)) car-return)
	     (match-fn lst pat))
	   (and (eq pat (car lst)) car-return))))
(defmatch match-? match-single m (if m m null-return))
(defmatch match-* match-single m
  (let ((l lst) (r nil))
    (loop while m
	  do (when m (setf r (cons (car m) r) l (cadr m) m (match-fn l pat))))
    `((,pat ,(mapcar #'cdr (reverse r))) ,l)))
(defmatch match-or match nil
  (let ((realpat (if (symbolp pat) (cdr (getf pat-alist pat)) pat)))
    (mapcar (lambda (i)
	      (letif r2 (match-fn lst i)
		     (return-from match-or r2)))
	    realpat)
    nil))
(defun ispat (p)
  (and (listp p) (not (null p))))
(defun get-fn (p)
  (if (listp p)
      (if (symbolp (car p))
	  (if (string= (symbol-name (car p)) "?")
	      (values #'match-? (cadr p) nil)
	    (if (string= (symbol-name (car p)) "*")
		(values #'match-* (cadr p) nil)
	      (if (string= (symbol-name (car p)) "OR")
		  (values #'match-or (cdr p) nil)
		nil)))
	nil)
    (values #'match-single p nil)))
(defun match (lst pat pat-alist &key (verbose nil) (indent ""))
  (when verbose (format t "~a(match ~a ~a)~%" indent lst pat))
  (let ((dopat nil))
    (if (ispat (getf pat-alist pat))
	(setf dopat (getf pat-alist pat))
      (if (ispat pat)
	  (setf dopat pat)
	(return-from match
		     (match-single lst pat pat-alist 
				   :verbose verbose
				   :indent (concatenate 'string indent "+=")))))
    ;(when verbose (format t "  ~a~%" dopat))
    (multiple-value-bind
     (f np) (get-fn dopat)
     (if f
	 (funcall f lst np pat-alist :verbose verbose
		  :indent (concatenate 'string indent "+="))
       (let ((m nil)
	     (l lst)
	     (r nil)
	     (success t))
	 (dolist (p dopat)
	   (multiple-value-bind
	    (f np app) (get-fn p)
	    (setf m (funcall f l np pat-alist :verbose verbose
			     :indent (concatenate 'string indent "+=")))
	    (when (not m)
	      (setf success nil)
	      (return nil))
	    (push (car m) r)
	    (setf l (cadr m))
	    ;(when verbose (format t "    ~a~%    ~a~%    ~a~%" m l r))
	    ))
	 (and success (list (cons pat (reverse r)) l)))))))
