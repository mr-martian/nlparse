(defpackage :syntax-utils
  (:use :utils :cl)
  (:export :pat :ls-pat :ref-pat :ls-pat2 :the-pat
           :desc :bind
           :name :match :optional :next :next-dict :nodes :base-nodes
           *readtable*))
(in-package :syntax-utils)

(setf the-pat 'ls-pat)

(defclass pat ()
  ((next :initarg :next
         :accessor next
         :initform nil)
   (name :initarg :name
         :reader name
         :initform (error "must supply a name"))
   (next-dict :initform (make-hash-table)
              :reader next-dict
              :allocation :class)))
(defgeneric match (pat sen)
  (:documentation "match and return updated sentence, or nil"))
(defmethod initialize-instance :after ((p pat) &key)
  (setf (gethash (name p) (slot-value p 'next-dict)) p))

(defclass ls-pat-base (pat)
  ((nodes :initarg :nodes
          :reader nodes
          :initform nil)
   (fn :initarg :fn
       :reader fn
       :initform #'list)))
(defmethod basematch ((p ls-pat-base) insen)
  (let* ((sen (mapcar #'ls (copy insen)))
         (rf (loop for i from 0 upto (- (length sen) (length (nodes p)))
                   for th in sen
                   append (loop for j from 0 upto (1- (length th))
                                for thn in th
                                if (n= (car (nodes p)) thn)
                                collect (list (list i j)))))
         rt)
    (loop for pn in (cdr (nodes p)) do
          (progn
            (dolist (path rf)
              (let ((n (1+ (caar path))))
                (loop for x from 0 upto (1- (length (elt sen n)))
                      for xn in (elt sen n) do
                      (when (n= pn xn)
                        (push (cons (list n x) path) rt)))))
            (setf rf rt rt nil)))
    (mapcar #'reverse rf)))
(defun getpath (sen path)
  (loop for n in path collect (copy (elt (ls (elt sen (car n))) (cadr n)))))
(defmethod applyfn ((p ls-pat-base) insen path)
  (let ((pre (copy (subseq insen 0 (caar path))))
        (post (copy (subseq insen (1+ (caar (last path))))))
        vl)
    (append pre (ls (apply (fn p) (getpath insen path))) post)))

(defclass ls-pat (ls-pat-base) ())
(defmethod match ((p ls-pat) insen)
  (mapcar (lambda (path) (applyfn p insen path)) (basematch p insen)))

(defclass ref-pat (ls-pat-base)
  ((ref-nodes :reader ref-nodes
              :initarg :ref-nodes
              :initform nil)
   (wilds :reader wilds
          :allocation :class
          :initform '(:@1 :@2 :@3 :@4 :@5 :@6 :@7 :@8 :@9))
   (backrefs :reader backrefs
             :allocation :class
             :initform '(:%1 :%2 :%3 :%4 :%5 :%6 :%7 :%8 :%9))
   (paths :reader paths
          :initform nil)))
(defmethod initialize-instance :after ((p ref-pat) &key)
  (setf (slot-value p 'nodes)
        (mapcar (lambda (node)
                  (let ((r (copy node)))
                    (dolist (i (append (wilds p) (backrefs p)))
                      (setf r (copy-replace r i :~)))
                    r))
                (ref-nodes p)))
  (setf (slot-value p 'paths)
        (mapcar (lambda (i)
                  (loop for n from 0 upto (1- (length (nodes p))) do
                        (multiple-value-bind
                         (path is) (locate (elt (nodes p) n) i)
                         (when is
                           (return (list n path))))))
                (wilds p))))
(defmethod match ((p ref-pat) insen)
  (let* ((sen (mapcar #'ls (copy insen))) (matches (basematch p sen)) r)
    (dolist (nl matches)
      (let* ((nodes (getpath sen nl))
             (vals (loop for pp in (paths p) collect
                         (when pp (getval (elt nodes (car pp)) (cadr pp)))))
             (pats (copy (ref-nodes p))))
        (loop for i in (wilds p) do (setf pats (copy-replace pats i :~)))
        (loop for v in vals for i in (backrefs p) do
              (setf pats (copy-replace pats i v)))
        (when (loop for sn in nodes for pn in pats always (n= sn pn))
          (push nl r))))
    (mapcar (lambda (path) (applyfn p sen path)) r)))

(defmacro bind (dir flag)
  `(lambda ,(if (eq dir :<) '(b a) '(a b))
     (let ((r (copy b)))
       (setf (gethash ,flag r) (copy a))
       r)))
(defmacro desc (dir)
  `(lambda ,(if (eq dir :<) '(b a) '(a b))
     (let ((r (copy b)))
       (push (copy a) (gethash :descs r))
       r)))
(read-mac s #\$ (let ((r (copy {(:~)})))
                  (setf (gethash :type r) (read s t nil t))
                  r))
(read-mac s #\! (let* ((typ (read s t nil t)) (fl (read s t nil t))
                       (h (copy {(:~)})))
                  (setf (gethash :type h) typ)
                  (dolist (i fl)
                    (setf (gethash (car i) h) (cdr i)))
                  h))
