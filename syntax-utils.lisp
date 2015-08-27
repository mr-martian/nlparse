(defpackage :syntax-utils
  (:use :utils :cl)
  (:export :pat :ls-pat :ref-pat
           :desc :bind
           :name :match :optional :next :next-dict :nodes :base-nodes
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

(defclass ref-pat (pat)
  ((nodes :initarg :nodes
          :reader nodes
          :initform nil);(error "must supply a list"))
   (fn :initarg :fn
       :reader fn
       :initform (error "must supply a function"))
   (base-nodes :reader base-nodes
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
  (setf (slot-value p 'base-nodes)
        (mapcar (lambda (node)
                  (let ((r node))
                    (dolist (i (append (wilds p) (backrefs p)))
                      (setf r (copy-replace r i :~)))
                    r))
                (nodes p)))
  (setf (slot-value p 'paths)
        (mapcar (lambda (i)
                  (loop for n from 0 upto (1- (length (nodes p))) do
                        (multiple-value-bind
                         (path is) (locate (elt (nodes p) n) i)
                         (when is
                           (return (list n path))))))
                (wilds p))))
(defmethod match ((p ref-pat) sen)
  (let* ((insen (mapcar #'ls (copy sen)))
         (rf (loop for i from 0 upto (- (length insen) (length (nodes p)))
                   append (loop for j from 0 upto (1- (length (elt insen i)))
                                if (n= (car (base-nodes p))
                                       (elt (elt insen i) j))
                                collect (list (list i j)))))
         rt (i 1))
    (loop while (< i (length (nodes p))) do
          (progn
            (dolist (path rf)
              (let ((n (+ i (caar path))))
                (loop for x from 0 upto (1- (length (elt insen n))) do
                      (when (n= (elt (base-nodes p) i) (elt (elt insen n) x))
                        (push (append path (list (list n x))) rt)))))
            (setf rf rt rt nil)
            (incf i)))
    (dolist (nodelist rf)
      (let ((vals (loop for pp in (paths p) collect
                        (when pp
                          (getval (elt (elt insen (car (elt nodelist (car pp))))
                                       (cadr (elt nodelist (car pp))))
                                  (cadr pp)))))
            (pats (copy (nodes p))))
        (loop for i in (wilds p) do (setf pats (copy-replace pats i :~)))
        (loop for v in vals for i in (backrefs p) do
              (setf pats (copy-replace pats i v)))
        (let ((apnodes (loop for x in nodelist collecting
                             (elt (elt insen (car x)) (cadr x))))
              (pre (copy (subseq insen 0 (caar nodelist))))
              (post (copy (subseq insen (1+ (caar (last nodelist)))))))
          (when (loop for pn in pats for sn in apnodes always (n= pn sn))
            (push (append pre (ls (apply (fn p) (copy apnodes))) post) rt)))))
    rt))

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
