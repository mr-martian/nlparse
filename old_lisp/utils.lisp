(defpackage :utils
  (:use :cl)
  (:export :*readtable*
           :ls
           :read-mac :mac-char
           :make-keyword
           :get-slots :quick-class
           :plist->hash
           :aif
           :out :out-l
           :gensyms
           :hash->plist :n=
           :copy
           :copy-replace :locate :getval
           :str))
(in-package :utils)

(defun ls (n)
  (if (listp n)
      n
    (list n)))

(defmacro read-mac (v c &body body)
  (let ((a (gensym)) (b (gensym)))
    `(,(if (listp c)
           'set-dispatch-macro-character
         'set-macro-character)
      ,@(ls c) #'(lambda (,v ,a &optional ,b)
                  (declare (ignore ,a) (ignore ,b))
                  ,@body))))

;(defmacro mac-char (a b)
;  `(set-macro-character ,a (get-macro-character ,b)))

(defun mac-char (a b)
  (set-macro-character a (get-macro-character b)))

(defun make-keyword (symbol)
  (intern (format nil "~a" symbol) "KEYWORD"))

;taken from http://stackoverflow.com/questions/3086561/make-clos-objects-printable-in-lisp
;(set-macro-character
; #\{ #'(lambda (str char)
;         (declare (ignore char))
;         (let ((list (read-delimited-list #\} str t)))
;           (let ((type (first list)) (list (second list)))
;             (let ((class (allocate-instance (find-class type))))
;               (loop for i in list do
;                     (ignore-errors
;                       (setf (slot-value class (car i)) (cdr i))))
;               class)))))
;(defun get-slots (object)
;  ;; thanks to cl-prevalence
;  (mapcar #'clos:slot-definition-name (clos:class-slots (class-of object))))

(defmacro quick-class (name vars)
  `(progn
     (defclass ,name ()
       ,(loop for v in vars collecting
              `(,v :initarg ,(make-keyword v)
                   :accessor ,v
                   :initform nil)))
     ;also from the above stack-overflow
     (defmethod print-object ((object ,name) stream)
       (format stream "{~s ~s}" (type-of object)
               (loop for i in ,vars ;(get-slots object)
                     collect (cons i (slot-value object i)))))))

(mac-char #\] #\))
(read-mac s #\[ `(lambda (_) ,(read-delimited-list #\] s t)))

(defun plist->hash (p)
  (let ((h (make-hash-table :size (length p) :test 'equal)))
    (dolist (i p)
      (if (eq i :~)
          (setf (gethash :~ h) nil)
        (setf (gethash (car i) h) (cdr i))))
    h))

(mac-char #\} #\))
;(read-mac s #\{
;          (let ((l (read-delimited-list #\} s t)) (g (make-hash-table)))
;            (dolist (i l)
;              (setf (gethash (car i) g) (cdr i)))
;            g))
(read-mac s #\{ (plist->hash (read-delimited-list #\} s t)))

(defmacro aif (v c y n)
  `(let ((,v ,c))
     (if ,v ,y ,n)))

(defun out (x) (format t "~a~%" x))
(defun out-l (&rest x) (format t "~{~a ~}~%" x))

(defmacro gensyms (ls &body body)
  `(let ,(loop for i in ls collecting `(,i (gensym)))
     ,@body))

(defun hash->plist (h)
  (loop for k being the hash-keys in h using (hash-value v)
        collect (if (eq k :~) :~ (cons k v))))
(defun n= (a b)
  (cond
   ((or (equal a b)
        (equal a :~) (equal b :~)
        (equal a '(:~)) (equal b '(:~)))
    t)
   ((functionp a) (funcall a b))
   ((functionp b) (funcall b a))
   ((and (stringp a) (stringp b)) (string= a b))
   ((and (listp a) (listp b)) (if (and (null (cdr (last a)))
                                       (null (cdr (last b))))
                                  (and (not (set-difference a b :test #'n=))
                                       (not (set-difference b a :test #'n=)))
                                (and (n= (car a) (car b))
                                     (n= (cdr a) (cdr b)))))
   ((and (hash-table-p a) (hash-table-p b))
    (n= (hash->plist a) (hash->plist b)))
   (t nil)))

(defun copy (thing)
  (cond
   ((null thing) nil)
   ((listp thing) (cons (copy (car thing)) (copy (cdr thing))))
   ((hash-table-p thing)
    ;(let ((h (make-hash-table :test (hash-table-test thing)
    ;                          :size (hash-table-size thing)
    ;                          :rehash-size (hash-table-rehash-size thing)
    ;                          :rehash-threshold (hash-table-rehash-threshold
    ;                                             thing))))
    ;  (loop for k being the hash-keys in thing using (hash-value v)
    ;        do (setf (gethash (copy k) h) (copy v)))
    ;  h))
    (let ((h (make-hash-table :size (hash-table-size thing))))
      (maphash (lambda (k v) (setf (gethash k h) v)) thing)
      h))
   (t thing)))

(defun copy-replace (struct thing rep &key (test #'n=))
  (cond
   ((funcall test struct thing) (copy rep))
   ((null struct) nil)
   ((listp struct) (cons (copy-replace (car struct) thing rep :test test)
                         (copy-replace (cdr struct) thing rep :test test)))
   ((hash-table-p struct)
    (let ((h (make-hash-table :size (hash-table-size struct)
                              :test (hash-table-test struct))))
      (maphash (lambda (k v)
                 (setf (gethash (copy-replace k thing rep :test test) h)
                       (copy-replace v thing rep :test test)))
               struct)
      h))
   (t struct)))

(defun locate (struct thing &key (test #'n=) path)
  (cond
   ((funcall test struct thing) (values (reverse path) t))
   ((null struct) nil)
   ((listp struct) (or (locate (car struct) thing :test test
                               :path (cons 'car path))
                       (locate (cdr struct) thing :test test
                               :path (cons 'cdr path))))
   ((hash-table-p struct)
    (let (r)
      (maphash (lambda (k v)
                 (aif n (locate v thing :test test
                                :path (cons (list 'gethash k) path))
                      (setf r n)
                      nil))
               struct)
      r))
   (t nil)))

(defun getval (struct path)
  (cond
   ((null path) struct)
   ((eq (car path) 'car) (getval (car struct) (cdr path)))
   ((eq (car path) 'cdr) (getval (cdr struct) (cdr path)))
   (t (getval (gethash (cadar path) struct) (cdr path)))))

(defun str (thing)
  (format nil "~a" thing))
