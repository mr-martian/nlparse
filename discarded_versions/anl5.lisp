(defpackage :anl
  (:use :cl)
  (:export :tag-sen))
(in-package :anl)

(defvar *dict-dir* "dicts/en/")

(set-macro-character #\] (get-macro-character #\)))
(set-macro-character #\[ #'(lambda (stream char)
                             `(lambda (_) ,(read-delimited-list #\] stream t))))
(set-macro-character #\{ ;taken from http://stackoverflow.com/questions/3086561/make-clos-objects-printable-in-lisp
                     #'(lambda (str char)
                         (declare (ignore char))
                         (let ((list (read-delimited-list #\} str t)))
                           (let ((type (first list))
                                 (list (second list)))
                             (let ((class (allocate-instance (find-class type))))
                               (loop for i in list do
                                     (setf (slot-value class (car i)) (cdr i)))
                               class)))))

(defun do-one (sen)
  (remove nil
          (loop for w in (directory (make-pathname :name :wild
                                                   :type :wild
                                                   :defaults *dict-dir*))
                appending
                (let ((l (read-from-string
                          (format nil "(~a)" (pathname-name w)))))
                  (when (and (>= (length sen) (length l))
                             (equal l (subseq sen 0 (length l))))
                    (loop for i in
                          (with-open-file (f w) (read f))
                          collect (list i (subseq sen (length l)))))))))
(defun tag-sen (sen)
  (let ((l (do-one (mapcar [intern (format nil "~a" _)] sen))) (r nil))
    (loop while l do
          (let ((s (pop l)))
            (if (cadr s)
                (let ((pl (do-one (cadr s))))
                  (loop for p in pl do
                        (if (listp (car s))
                            (push (list (cons (car p) (car s)) (cadr p)) l)
                          (push (list (list (car p) (car s)) (cadr p)) l))))
              (push (car s) r))))
    (mapcar #'reverse r)))
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
    :initform nil)
   (remsen
    :initarg :remsen
    :accessor remsen
    :initform nil)))
(defun node= (n1 n2)
  (if (equal (type n1) 'con)
      (and
       (equal (type n1) (type n2))
       (equal (is n1) (is n2))
       (equal (before n1) (before n2))
       (equal (after n1) (after n2))
       (equal (remsen n1) (remsen n2)))
    (and
     (equal (type n1) (type n2))
     (equal (is n1) (is n2))
     (equal (flags n1) (flags n2))
     (equal (descs n1) (descs n2))
     (equal (other n1) (other n2))
     (equal (remsen n1) (remsen n2)))))
(defclass connode ()
  ((type
    :initform 'con
    :reader type)
   (is
    :initarg :is
    :accessor is
    :initform nil)
   (before
    :initarg :before
    :accessor before
    :initform nil)
   (after
    :initarg :after
    :accessor after
    :initform nil)
   (remsen
    :initarg :remsen
    :accessor remsen
    :initform nil)))
(defun make-node (type &optional sen)
  (if (eq type 'con)
      (make-instance 'connode :remsen sen)
    (make-instance 'parsenode :type type :remsen sen)))
(defun copy-node (node)
  (if (equal (type node) 'con)
      (make-instance 'connode :is (is node) :before (before node) :after (after node) :remsen (remsen node))
    (make-instance 'parsenode :type (type node) :is (is node)
                   :flags (flags node) :descs (descs node) :other (other node) :remsen (remsen node))))
(defun get-slots (object) ;taken from http://stackoverflow.com/questions/3086561/make-clos-objects-printable-in-lisp
  ;; thanks to cl-prevalence
  (mapcar #'clos:slot-definition-name (clos:class-slots (class-of object))))
(defmethod print-object ((object parsenode) stream)
  (format stream "{~s ~s}" (type-of object)
          (loop for i in (get-slots object)
                collect (cons i (slot-value object i)))))
(defmethod print-object ((object connode) stream)
  (format stream "{~s ~s}" (type-of object)
          (loop for i in (get-slots object)
                collect (cons i (slot-value object i)))))
(defun flat (tree)
  (let ((r (loop for i in (remove nil tree) if (listp i) append (flat i) else collect i)))
    (if (listp r)
        r
      (list r))))
(defun ls (n)
  (if (listp n) n (list n)))
(defun match-node (node type flags)
  (and node
       (eq (type node) type)
       (or (not flags)
           (eq (getf (flags node) (car flags)) (cadr flags)))))
(defun o= (a b)
  (string= (format nil "~a" a) (format nil "~a" b)))
(defun clean (ls)
  (remove-duplicates (flat ls) :test #'o=))
(define-symbol-macro @ (gensym))
;(n mode type (hasflag val) fn nodes name giveflag)
;($ mode callfn placefn nodes name giveflag) ;mode = [1 ? *]
;(or name fn1 fn2 ...)
(defmacro match-fn (fname args)
  (let* ((sen @) (vars (list sen)) (gets '()) (pushes '()) (req '()) (s @) (nl @) (nln @) (p @) (n2 @) (ch @))
    (dolist (a args)
      (ccase (car a)
             (n (let ((name (or (seventh a) @)) (n @) (tn @))
                  (push (if (car vars)
                            `(setf ,(car vars)
                                   (clean
                                    (loop for ,n in ,(car vars) collecting
                                          (if (match-node (car (remsen ,n)) ',(third a) ',(fourth a))
                                              (let ((,tn (pop (remsen ,n))))
                                                (rotatef (remsen ,tn) (remsen ,n))
                                                (push ,tn ,name)
                                                ,n)
                                            ,(if (eq (cadr a) 1) nil n)))))
                          `(if (match-node (car ,sen) ',(third a) ',(fourth a))
                               (let ((,tn (pop ,sen)))
                                 (setf (remsen ,tn) ,sen)
                                 (push ,tn ,name))
                             ,(if (eq (cadr a) 1)
                                  `(progn
                                     ,@(loop for i in vars collecting `(format t "    ~a = ~a~%" ',i ,i))
                                     (return-from ,fname nil))
                                nil)))
                        gets)
                  (when (eq (cadr a) '*)
                    (push `(setf ,name
                                 (clean (loop for ,n in ,name collecting
                                              (let ((,tn (make-node 'list)))
                                                (rotatef (remsen ,n) (remsen ,tn))
                                                (setf (is ,tn)
                                                      (cons ,n (loop while (match-node (car (remsen ,tn)) ',(third a) ',(fourth a)) collect
                                                                     (pop (remsen ,tn)))))
                                                ,tn))))
                          gets))
                  (push name vars)
                  (when (eq (cadr a) 1)
                    (push (third a) req))
                  (when (and (fifth a) (sixth a))
                    (loop for i in (ls (sixth a)) do
                          (push `(loop for ,p in ,i do
                                       (loop for ,n in ,name do
                                             (progn
                                               (push ,n (,(fifth a) ,p))
                                               ,(when (eighth a)
                                                  `(push ',(eighth a) (,(fifth a) ,p))))))
                                pushes)))))
             ($ (let ((name (or (sixth a) @)) (n @) (tn @))
                  (push (if (car vars)
                            `(setf ,(car vars)
                                   (clean
                                    (loop for ,n in ,(car vars) appending
                                          (loop for ,tn in (,(third a) (remsen ,n)) do
                                                (if ,tn
                                                    (progn
                                                      (setf (remsen ,n) nil)
                                                      (push ,tn ,name)
                                                      ,n)
                                                  ,(if (eq (cadr a) 1) nil n))))))
                          `(let ((,tn (,(third a) ,sen)))
                             (if ,tn
                                 (mapcar [push _ ,name] ,tn)
                               ,(if (eq (cadr a) 1) `(return-from ,fname nil) nil))
                             ))
                        gets)
                  (when (eq (cadr a) '*)
                    (push `(setf ,name
                                 (clean
                                  (loop for ,n in ,name collecting
                                        (let ((,tn (make-node 'list)))
                                          (rotatef (remsen ,n) (remsen ,tn))
                                          (push ,n (is ,tn))
                                          ,tn))))
                          gets)
                    (push `(let ((,nl (mapcar #'copy-node ,name)) (,tn nil))
                             (loop while ,nl do
                                   (let* ((,n (pop ,nl)) (,p (,(third a) (remsen ,n))))
                                     (if ,p
                                         (loop for ,nln in ,p do
                                               (if ,nln
                                                   (let ((,n2 (copy-node ,n)))
                                                     (rotatef (remsen ,n2) (remsen ,nln))
                                                     (push ,nln (is ,n2))
                                                     (push ,n2 ,nl))
                                                 (push ,n ,tn)))
                                       (push ,n ,tn))))
                             (setf ,name (clean ,tn)))
                          gets)
                    (push `(setf ,name (mapcar [progn (setf (is _) (reverse (is _))) _] ,name)) gets))
                  (push name vars)
                  (when (and (fourth a) (fifth a)) ;($ mode callfn placefn nodes name giveflag) ;mode = [1 ? *]
                    (loop for i in (ls (fifth a)) do
                          (push `(setf ,i
                                       ;(clean
                                        (loop for ,p in ,i appending
                                              (loop for ,n in ,name collecting
                                                    (let ((,n2 (copy-node ,p)))
                                                      (push ,n (,(fourth a) ,n2))
                                                      ,(when (seventh a)
                                                         `(push ',(seventh a) (,(fourth a) ,n2)))
                                                      ,n2))));)
                                pushes)))))
             (or (let ((name (or (caadr a) @)) (g @) (fn @) (n @)) ;(or (name fn node) fn1 fn2 ...)
                   (if (car vars)
                       (progn
                         (push `(loop for ,n in ,(car vars) do
                                      (loop for ,fn in ',(cddr a) do
                                            (mapcar [push _ ,name] (funcall ,fn (remsen ,n)))))
                               gets)
                         (push `(setf ,name (clean ,name)) gets)
                         (push `(setf ,(car vars)
                                      (loop for ,n in ,(car vars) collect
                                            (progn
                                              (setf (remsen ,n) nil)
                                              ,n)))
                               gets))
                     (push `(loop for ,fn in ',(cddr a) do (push (funcall ,fn ,sen) ,name)) gets))
                   (push name vars)
                   (let ((pfn (cadr (cadr a))) (node (third (cadr a))))
                     (when (and pfn node)
                       (loop for i in (ls node) do
                             (push `(setf ,i
                                          (loop for ,p in ,i appending
                                                (loop for ,n in ,name collecting
                                                      (let ((,n2 (copy-node ,p)))
                                                        (push ,n (,pfn ,n2))
                                                        ,n2))))
                                   pushes))))))
             ))
    `(defun ,fname (,s)
       (format t "~a: ~a~%" ',fname ,s)
       (let ((,sen (list (make-node 'empty (mapcar #'copy-node (clean ,s))))) ,@(mapcar [list _ nil] vars))
         (and
          ,s
          (loop for ,ch in ',req always (member ,ch ,s :key #'type))
          (progn
            ,@(reverse gets)
            ,@(loop for i in vars collecting `(format t "    ~a = ~a~%" ',i ,i))
            ,(when (not (eq (car vars) 'is))
               `(progn
                  (setf is (loop for ,nl in ,(car vars) appending
                                 (mapcar [let ((,nln (copy-node _)))
                                           (setf (remsen ,nln) (remsen ,nl))
                                           ,nln]
                                         is)))
                  (mapcar [setf (remsen _) nil] ,(car vars))))
            ,@(reverse pushes)
            (let ((ret (clean is)))
              ,@(loop for i in vars collecting `(format t "    ~a = ~a~%" ',i ,i))
              (format t "  ~a RETURN: ~a~%" ',fname ret)
              ret)))))))

;(n mode type (hasflag val) fn nodes name giveflag)
;($ mode callfn placefn nodes name giveflag) ;mode = [1 ? *]
;(or name fn1 fn2 ...)
;(format t "~a~%" (remove-duplicates (tag-sen '(the empty beginning)) :test #'o=))
(match-fn $test ((n 1 art () flags is a :q) (n ? adj () nil nil is)))
(match-fn $testb ((n * art () other is a :v) (n 1 adj () nil nil is)))
(match-fn $test2 (($ 1 $test other is a) (n 1 noun () nil nil is)))
(match-fn $test2a ((or (a other is) $test $testb) (n 1 noun () nil nil is)))
;(n1 adj () descs is) (n1 noun (:plural t) nil nil is) -> {parsenode ((type . noun) (flags :plural t) (descs {parsenode ((type . adj))}))}
;(format t "~a~%" (macroexpand-1 '(match-fn $test ((n1 art () remsen is a) (n? adj () nil nil is) (n* noun () flags (a is))))))
(format t "~a~%" ($test2 (flat (remove-duplicates (flat (tag-sen '(the empty beginning))) :test #'o=))))
