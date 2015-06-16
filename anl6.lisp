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
                                     (ignore-errors
                                       (setf (slot-value class (car i))
                                             (cdr i))))
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
    :initform nil)))
(defun node= (n1 n2)
  (and
   (equal (type n1) (type n2))
   (equal (is n1) (is n2))
   (equal (flags n1) (flags n2))
   (equal (descs n1) (descs n2))
   (equal (other n1) (other n2))))
(defun make-node (type)
  (make-instance 'parsenode :type type))
(defun copy-node (node)
  (make-instance 'parsenode :type (type node) :is (is node) :flags (flags node)
                 :descs (descs node) :other (other node)))
(defun get-slots (object) ;taken from http://stackoverflow.com/questions/3086561/make-clos-objects-printable-in-lisp
  ;; thanks to cl-prevalence
  (mapcar #'clos:slot-definition-name (clos:class-slots (class-of object))))
(defmethod print-object ((object parsenode) stream)
  (format stream "{~s ~s}" (type-of object)
          (loop for i in (get-slots object)
                collect (cons i (slot-value object i)))))
(defun match-node (node type flags)
  (and node
       (eq (type node) type)
       (or (not flags)
           (eq (getf (flags node) (car flags)) (cadr flags)))))
(defun o= (a b)
  (string= (format nil "~a" a) (format nil "~a" b)))
(defun ls (n) (if (listp n) n (list n)))
(defun flat (tree)
  (ls (loop for i in (remove nil tree)
            if (listp i) append (flat i)
            else collect i)))
(defun clean (ls)
  (remove-duplicates (flat ls) :test #'o=))
(define-symbol-macro @ (gensym))
(defmacro match-fn (fname args)
  (let ((arpos 0) vars gets pushes req (sen @) (s @) (it @) (-it @))
    (dolist (a args)
      (incf arpos)
      (ccase (car a)
             (n (let ((name (or (seventh a) @)) (i @) (r @) (tn @) (it @))
                  (push `(let (,r)
                           (dolist (,i ,sen)
                             ,(if (eq (cadr a) '*)
                                  `(loop while (match-node (car (elt ,i 0))
                                                           ',(third a)
                                                           ',(fourth a))
                                         do (push (pop (elt ,i 0))
                                                  (elt ,i ,arpos))
                                         finally (let ((,tn (make-node 'list)))
                                                   (setf (is ,tn)
                                                         (reverse (elt ,i
                                                                       ,arpos)))
                                                   (setf (elt ,i ,arpos) ,tn)
                                                   (push ,i ,r)))
                                `(if (match-node (car (elt ,i 0))
                                                 ',(third a) ',(fourth a))
                                     (progn
                                       (setf (elt ,i ,arpos) (pop (elt ,i 0)))
                                       (push ,i ,r))
                                   ,(when (eq (cadr a) '?) `(push ,i ,r)))))
                           (setf ,sen ,r))
                        gets)
                  (push (list name arpos) vars)
                  (when (eq (cadr a) 1)
                    (push (list (third a) (fourth a)) req))
                  (when (and (fifth a) (sixth a))
                    (dolist (i (ls (sixth a)))
                      (push (list name i (fifth a) (eighth a)) pushes)))))
             ;($ mode callfn placefn nodes name giveflag) ;mode = [1 ? *]
             ($ (let ((name (or (sixth a) @)) (r @) (i @)
                      (h @) (h2 @) (c @) (r2 @) (s2 @) (c2 @))
                  (push `(let (,r)
                           (dolist (,i ,sen)
                             ,(if (eq (cadr a) '*)
                                  `(let (,r2 (,s2 (let ((x ,i))
                                                    (setf (elt x ,arpos)
                                                          (make-node 'list))
                                                    (list x))))
                                     (loop while ,s2 do
                                           (let* ((,c (pop ,s2))
                                                  (,h (,(third a)
                                                       (elt ,c 0))))
                                             (if ,h
                                                 (loop for ,h2 in ,h do
                                                       (let ((,c2 (copy-seq ,c)))
                                                         (setf (elt ,c2 0)
                                                               (cadr ,h2))
                                                         (push (car ,h2)
                                                               (is (elt ,c2
                                                                        ,arpos)))
                                                         (push ,c2 ,s2)))
                                               (push ,c ,r2))))
                                     (loop for ,h in ,r2 do
                                           (let ((,c2 ,h))
                                             (nreverse (is (elt ,c2 ,arpos)))
                                             (push ,c2 ,r))))
                                `(let ((,h (,(third a) (elt ,i 0))))
                                   (if ,h
                                       (loop for ,h2 in ,h do
                                             (let ((,c (copy-seq ,i)))
                                               (setf (elt ,c 0) (cadr ,h2))
                                               (setf (elt ,c ,arpos) (car ,h2))
                                               (push ,c ,r)))
                                     ,(if (eq (cadr a) '?) `(push ,i ,r))))))
                           (setf ,sen ,r))
                        gets)
                  (push (list name arpos) vars)
                  (when (and (fourth a) (fifth a))
                    (dolist (i (ls (fifth a)))
                      (push (list arpos i (fourth a) (seventh a)) pushes)))))
             ;(or fns placefn nodes name flag)
             (or (let ((name (or (fifth a) @)) (i @) (r @) (f @) (n @) (h @))
                   (push `(let (,r)
                            (dolist (,i ,sen)
                              (dolist (,f ',(cadr a))
                                (loop for ,h in (funcall ,f (elt ,i 0)) do
                                      (let ((,n (copy-seq ,i)))
                                        (setf (elt ,n ,arpos) (car ,h))
                                        (setf (elt ,n 0) (cadr ,h))
                                        (push ,n ,r)))))
                            (setf ,sen ,r))
                         gets)
                   (push (list name arpos) vars)
                   (when (and (third a) (fourth a))
                     (dolist (i (ls (fourth a)))
                       (push (list arpos i (third a) (sixth a)) pushes)))))))
    `(defun ,fname (,s)
       (let ((,sen (list (make-array ,(1+ (length args))))) ,@vars)
         (setf (elt (car ,sen) 0) ,s)
         (let ((req ',(reverse req)))
           (when req
             (dolist (i ,s)
               (when (match-node i (caar req) (cadar req))
                 (pop req))))
           (when req (return-from ,fname nil)))
         ,@(reverse gets)
         (mapcar [list (elt _ is) (elt _ 0)]
                 (loop for ,-it in ,sen collect
                       (let ((,it ,-it))
                         ,@(mapcar [list 'progn
                                         `(push (elt ,it ,(car _))
                                                (,(third _) (elt ,it ,(cadr _))))
                                         (when (fourth _)
                                           `(push ',(fourth _)
                                                  (,(third _)
                                                   (elt ,it ,(cadr _)))))]
                                   (reverse pushes))
                         ,it)))))))

(match-fn $test ((n 1 art () flags is a :q) (n ? adj () nil nil is)))
(match-fn $testb ((n * art () other is a :v) (n 1 adj () nil nil is)))
(match-fn $test2 (($ 1 $test other is a) (n 1 noun () nil nil is)))
(match-fn $test2a ((or ($test $testb) other is a) (n 1 noun () nil nil is)))

(format t "~a~%" ($test2 (clean (tag-sen '(the empty beginning)))))
