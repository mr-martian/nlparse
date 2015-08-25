(load "~/quicklisp/setup.lisp")
(ql:quickload :cl-ppcre)
(defpackage :morphology-utils
  (:use :utils :cl-ppcre :cl)
  (:export :*pats* :strip-end :lit-ls :lit-dict :load-ls :send :strip-send
           :western-script-parser))
(in-package :morphology-utils)

(defvar *pats* nil)

(defmacro strip-end (name rem add pat dct)
  (push name *pats*)
  (let ((p (create-scanner pat)) (s (gensym)) (r (gensym)))
    `(defun ,name (,s)
       (when (scan ,p ,s)
         (let ((,r ,dct))
           (setf (gethash :is ,r)
                 (format nil "~a~a" (subseq ,s 0 (- (length ,s) ,rem)) ,add))
           ,r)))))

(defmacro lit-ls (name &rest ls)
  (push name *pats*)
  (let ((s (gensym)))
    `(defun ,name (,s)
       (getf (list ,@ls) ,s))))
(defmacro lit-dict (name dct &rest add)
  (push name *pats*)
  (let ((s (gensym)) (r (gensym)) (a (gensym)))
    `(defun ,name (,s)
       (let ((,r (gethash ,s ,dct)))
         (when ,r
           ,@(loop for i in add collecting
                   `(setf (gethash ,(car i) ,r) ,(cdr i))))
         ,r))))

(defmacro load-ls (name lang file dct)
  (push name *pats*)
  (let ((lst (with-open-file (f (format nil "langs/~a/~a" lang file))
                             (loop for i = (read-line f nil nil)
                                   while i collect i)))
        (s (gensym)) (r (gensym)))
    `(defun ,name (,s)
       (when (member ,s ',lst :test #'string=)
         (let ((,r ,dct))
           (setf (gethash :is ,r) ,s)
           ,r)))))

(defmacro send (name dest &rest pl)
  (let ((s (gensym)) (fn (gensym)) (r (gensym)) (rr (gensym)) (r0 (gensym)))
    `(defun ,name (,s)
       (loop for ,fn in ',(ls dest) appending
             (let ((,rr (funcall ,fn ,s)))
               (loop for ,r0 in (ls ,rr) collect
                     (let ((,r (copy ,r0)))
                       ,@(loop for i in pl collecting
                               `(setf (gethash ,(car i) ,r) ,(cdr i)))
                       ,r)))))))
(defmacro strip-send (name rem add pat dest &rest pl)
  (push name *pats*)
  (let ((p (create-scanner pat))
        (s (gensym)) (r (gensym)) (fn (gensym)) (rr (gensym)) (r0 (gensym)))
    `(defun ,name (,s)
       (when (scan ,p ,s)
         (loop for ,fn in ',(ls dest) appending
               (let ((,rr (funcall ,fn
                                   (format nil "~a~a"
                                           (subseq ,s 0 (- (length ,s) ,rem))
                                           ,add))))
                 (loop for ,r0 in ,rr collect
                       (let ((,r (copy ,r0)))
                         (when ,r
                           ,@(loop for i in pl collecting
                                   `(setf (gethash ,(car i) ,r) ,(cdr i))))
                         ,r))))))))

(defmacro western-script-parser (package pats punct &key (contractions nil)
                                         (contraction-char #\') contraction-func
                                         (hyphenation nil) hyphen-func)
  `(defun ,package (sen)
     (let ((l (remove "" (split " " (string-downcase sen)))) (ret '(())))
       (loop while l do
             (let ((c (pop l)))
               (loop while (member (elt c (1- (length c)))
                                   ',(coerce punct 'list))
                     do (progn
                          (push (str (elt c (1- (length c)))) l)
                          (setf c (subseq c 0 (1- (length c))))))
               (when (member (elt c 0) ',(coerce punct 'list))
                 (push (subseq c 1) l)
                 (setf c (str (elt c 0))))
               (let ((r (loop for p in ,pats appending
                              (copy (ls (funcall p c)))))
                     multi)
                 ,(when contractions
                    `(when (scan ,(str contraction-char) c)
                       (loop for i in (multiple-value-list
                                       (funcall ,contraction-func c))
                             do (if (> (length (ls i)) 1)
                                    (push i multi)
                                  (push (car (ls i)) r)))))
                 ,(when hyphenation
                    `(when (scan "-" c)
                       (loop for i in (multiple-value-list
                                       (funcall ,hyphen-func c))
                             do (if (> (length (ls i)) 1)
                                    (push i multi)
                                  (push (car (ls i)) r)))))
                 (setf ret (loop for s in ret appending
                                 (cons (append s (list r))
                                       (when multi
                                         (mapcar [append (copy s) _]
                                                 multi))))))))
       (values ret (> (length ret) 1)))))
