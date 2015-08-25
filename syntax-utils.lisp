(defpackage :syntax-utils
  (:use :utils :cl)
  (:export :pat :ls-pat
           :desc :bind
           :name :match :optional :next :next-dict :nodes
           *readtable*))
(in-package :syntax-utils)

(defclass pat ()
  ((optional :initarg :optional
             :reader optional
             :initform nil)
   (next :initarg :next
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

(defclass ls-pat (pat)
  ((nodes :initarg :nodes
          :reader nodes
          :initform (error "must supply a list"))
   (fn :initarg :fn
       :reader fn
       :initform (error "must supply a function"))))
(defmethod match ((p ls-pat) insen)
  (labels ((match1 (pn sn)
                   (loop for s in (ls sn) appending
                         (when (n= pn s)
                           (list s))))
           (apply-fn (fn now &optional pre)
                     (loop for i in (car now) appending
                           (if (cdr now)
                               (apply-fn fn (cdr now) (append pre (list i)))
                             (ls (apply fn (append pre (list i)))))))
           )
          (let ((i 0) pat now sen)
            (tagbody
             fail
             (setf pat (copy (nodes p)) now nil sen (subseq (copy insen) i))
             (when (< (length sen) (length pat)) (go nosen))
             partial
             (when (and pat sen)
               (aif n (match1 (car pat) (car sen))
                    (progn
                      (push n now)
                      (pop pat)
                      (pop sen)
                      (go partial))
                    (progn
                      (incf i)
                      (go fail))))
             nosen)
            (unless pat
              (loop for th in (apply-fn (fn p) (reverse now)) collect
                    (append (copy (subseq insen 0 i)) (ls th)
                            (copy (subseq insen (+ i (length (nodes p)))))))))
          ))

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
