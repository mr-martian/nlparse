(load "anl4_tagging.lisp")
(defpackage :anl-parse
  (:use :cl :anl-tag)
  (:export :parse))
(in-package :anl-parse)

(set-macro-character #\] (get-macro-character #\)))
(set-macro-character #\[ #'(lambda (stream char)
			     `(lambda (_) ,(read-delimited-list #\] stream t))))
(defclass parsenode ()
  ((type
    :initarg :type
    :reader type
    :initform nil)
   (is
    :initarg :is
    :accessor is
    :initform nil)
   (flags
    :initarg :flags
    :accessor flags
    :initform nil)
   (descs
    :initarg :descs
    :accessor descs
    :initform nil)
   (other
    :initarg :other
    :accessor other
    :initform nil)))
(defun copy-node (node)
  (make-instance 'parsenode :type (type node) :is (is node)
		 :flags (flags node) :descs (descs node) :other (other node)))
(defun node= (n1 n2)
  (and
   (equal (type n1) (type n2))
   (equal (is n1) (is n2))
   (equal (flags n1) (flags n2))
   (equal (descs n1) (descs n2))
   (equal (other n1) (other n2))))
(defun make-node (type)
  (make-instance 'parsenode :type type))
(defmacro match-fn (name type args) ;arg: (mode type location [flag])
  (flet
   ((do1 (? e fn f)
	 `(setf r
		(remove nil
			(mapcar [if (eq (caaadr _) ',e)
				    (let ((a (pop (cadr _))))
				      (push (cadr a) (,fn (car _)))
				      ,(when f
					 (list 'push f (list fn '(car _))))
				      _)
				  ,(if ? '_ nil)]
				r))))
    (do$ (? _)
	 `(setf r
		(remove nil
			(loop for x in r appending
			      (let ((s (cons x
					     (loop for y in (,(cadr _) (cadr x))
						   collecting
						   (let ((c (copy-node (car x))))
						     (push (car y) (,(caddr _) c))
						     (list c (copy-tree (cadr y))))))))
				,(when ? '(pop s))
				s))))))
   `(defun ,name (sen)
      (let ((r (list (list (make-node ',type) sen))))
	,@(mapcar [let ((e (cadr _)) (fn (caddr _)) (f (cadddr _)))
		    (ccase (car _)
			   (1 (do1 nil e fn f))
			   ($ (do$ nil _))
			   (1? (do1 t e fn f))
			   ($? (do$ t _))
			   (1* `(setf r
				      (remove nil
					      (loop for x in r appending
						  (cons x
							(loop for y on (cadr x) while (eq (caaar y) ',(cadr _)) collect
							      (let ((n (copy-node (car x))))
								(push (cadar y) (,(caddr _) n))
								(list n (cdr y)))))))))
			 ($* `(setf r
				    (remove nil
					    (loop for x in r appending
						  (cons x
							(let* ((fn ',(cadr _)) (d nil) (g (funcall fn (cadr x))))
							  (loop while g do
								(let* ((h (pop g)) (a (funcall fn (cadr h))))
								  (if a
								      (dolist (b a)
									(let ((i (copy-node (car h))))
									  (push (car b) (,(caddr _) i))
									  (push (list i (cadr b)) g)))
								    (push h d))))
							  d))))))
			 (! `(loop for x in r do
				   (progn
				     (push ',(cadr _) (flags (car x)))
				     ,(when (cadddr _)
					`(push ',(cadddr _) (flags (car x))))))))]
		  args)
	r))))
(defvar *pats* '())
(defmacro rules (args)
  `(progn ,@(mapcar [progn (push (car _) *pats*) (cons 'match-fn _)] args)))
(defmacro defor (name fns)
  (push name *pats*)
  `(defun ,name (sen)
     (remove nil (loop for f in ',fns collecting (funcall f sen)))))

(rules
 (($adj adj ((1? desc descs) (1 adj is)))
  ($adv adv ((1? desc descs) (1 adv is)))
  ($prep prep ((1 prep is) ($ $noun other)))
  ($ns noun ((1? art flags :article) ($* $adj descs) (1 noun-1 is)
	     ($? $prep descs) (! nil flags :plural)))
  ($np noun ((1? art flags :article) ($* $adj descs) (1 noun+ is)
	     ($? $prep descs) (! t flags :plural)))))
(defor $noun ($ns $np))

(defun get-in (tree &optional (pack :anl-parse))
  (if (listp tree)
      (mapcar #'get-in tree)
    (intern (format nil "~a" tree) pack)))
(defun tag (sen)
  (get-in (tag-sen (get-in sen :anl-tag))))
(format t "~a~%" ($prep (car (tag '(in the soup)))))
