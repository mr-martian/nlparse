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
  ;(format t "(~a ~a)~%" (name p) insen)
  (labels ((match1 (pn sn)
                   ;(format t "(match1 ~a ~a)~%" pn sn)
                   (loop for s in (ls sn) appending
                         (when (n= pn s)
                           ;(format t "  ~a matched!~%" s)
                           (list s))))
           (apply-fn (fn now &optional pre)
                     ;(format t "(apply-fn ~a ~a ~a)~%" fn now pre)
                     (let* ((l (ls now)) (n (ls (car l))) (r (cdr l)))
                       (loop for i in n appending
                             (if r
                                 (apply-fn fn r (append pre (list i)))
                               (ls (apply fn (append pre (list i))))))))
           )
          (let ((sen (copy insen)) pat pre now)
            (tagbody
             fail
             (setf pat (copy (nodes p)) now nil)
             (when (< (length sen) (length pat)) (go nosen))
             (loop while (and sen (not (match1 (car pat) (car sen)))) do
                   (push (pop sen) pre))
             (unless sen (go nosen))
             partial
             (when pat
               (aif n (match1 (car pat) (car sen))
                    (progn
                      (push n now)
                      (pop pat)
                      (pop sen)
                      (go partial))
                    (progn
                      (let ((len (length pre)))
                        (push (copy (elt insen len)) pre)
                        (if (> (length insen) (+ (length (nodes p)) len))
                            (setf sen (append (copy (subseq insen (1+ len)))
                                              sen))
                          (go nosen)))
                      (go fail))))
             nosen)
            (unless pat
              (append (reverse pre) (apply-fn (fn p) now) sen)))))

(defmacro bind (dir flag)
  `(lambda ,(if (eq dir :<) '(a b) '(b a))
     (let ((r (copy b)))
       (setf (gethash ,flag r) (copy a))
       r)))
(defmacro desc (dir)
  `(lambda ,(if (eq dir :<) '(a b) '(b a))
     (let ((r (copy b)))
       (push (copy a) (gethash :descs r))
       r)))
(read-mac s #\$ (let ((r {(:~)}))
                  (setf (gethash :type r) (read s t nil t))
                  r))
(read-mac s #\! (let* ((typ (read s t nil t)) (fl (read s t nil t)) (h {(:~)}))
                  (setf (gethash :type h) typ)
                  (dolist (i fl)
                    (setf (gethash (car i) h) (cdr i)))
                  h))
