(defpackage :syntax
  (:use :syntax-utils :utils :cl)
  (:export :pats))
(in-package :syntax)

(defun type= (n1 n2)
  (eq (if (hash-table-p n1)
          (gethash :type n1)
        n1)
      (if (hash-table-p n2)
          (gethash :type n2)
        n2)))
(defmacro make-conj-pats (comma)
  (gensyms
   (m n bef aft)
   `(let (,m)
      (defun ,bef (,n) (setf ,m ,n) t)
      (defun ,aft (,n)
        (prog1
            (and (type= ,n :conjunction)
                 (type= ,m (gethash :after ,n)))
          (setf ,m nil)))
      (make-instance 'ls-pat :optional nil :next '(conj-before)
                     :name ',(if comma 'conj-before 'conj-just-before)
                     :nodes ,(if comma
                                 `(list #',bef !:punct ((:is . :comma)) #',aft)
                               `(list #',bef #',aft))
                     :fn (bind :> :just-before)))))

(setf pats
      (list
       (make-instance 'ls-pat :optional t :next '(adv-adj adj) :name 'adv-adj
                      :nodes (list !:desc ((:verbal . t)) !:desc ((:verbal)))
                      :fn (desc :>))
       (make-instance 'ls-pat :optional t :next '(adj article prep) :name 'adj
                      :nodes (list !:desc ((:verbal)) $:noun) :fn (desc :>))
       (make-instance 'ls-pat :optional nil :next '(prep) :name 'article
                      :nodes (list $:article $:noun) :fn (bind :> :article))
       (make-instance 'ls-pat :optional nil :next '(desc-prep) :name 'prep
                      :nodes (list $:preposition $:noun) :fn (bind :< :obj))
       (make-instance 'ls-pat :optional t :next '() :name 'desc-prep
                      :nodes (list $:noun !:preposition ((:obj . :~)))
                      :fn (desc :<))
       (make-instance 'ls-pat :optional t :next '(conj-just-before conj-before)
                      :name 'conj-after :nodes (list $:conjunction :~)
                      :fn (bind :< :after))
       ;(make-conj-pats nil)
       ;(make-conj-pats t)
       ;(let (p)
       ;  (make-instance 'ls-pat :optional nil :next '() :name 'aux
       ;                 :nodes (list (lambda (n)
       ;                                (when (n= n $:aux-verb)
       ;                                  (setf p (gethash :pat n))
       ;                                  t))
       ;                              (lambda (n)
       ;                                (prog1
       ;                                    (n= n p)
       ;                                  (setf p nil))))
       ;                 :fn (lambda (a v)
       ;                       (let ((r (copy v)))
       ;                         (dolist (i (gethash :give a))
       ;                           (setf (gethash (car i) r) (cdr i)))
       ;                         r))))
       ))

(let ((r (make-instance 'ref-pat :optional t :next nil :name 'stuff
                        :nodes '(:@1 :%1) :fn #'list)))
  (format t "=====~%")
  (out (match r '(a (b c) c d)))
  (out (next-dict r))
  (out (nodes r))
  (out (base-nodes r))
  (format t "=====~%"))
