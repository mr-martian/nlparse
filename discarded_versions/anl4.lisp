(defpackage :anl
  (:use :cl)
  (:export :tag-sen))
(in-package :anl)

(defvar *dict-dir* "dicts/en/")

(setf *word-types* '(adj adv art con con+ desc dep ing loc noun-1 noun+ part prep
       pro punc verb-f verb-imp verb-inf verb-pa verb-pr))
(setf *words*
      '(adj (empty formless good green quick soft watery wet)
            adv (quickly)
            art (a an the)
            con (but for nor so yet)
            con+ (and or)
            desc (very)
            dep (that which)
            ing (greening hovering moving singing)
            loc (now then)
            noun-1 (beginning darkness day deep earth God green light member
                              night shape sock soup spirit surface water)
            noun+ (heavens soups)
            part (be)
            prep (above from in of on out over to under up without)
            pro (he her him I it me that them there they us we)
            punc (|'| |"|)
            verb-f ((will sing))
            verb-imp (let make sing)
            verb-inf ((to sing))
            verb-pa (called created got (got out of) looked (looked up) said saw separated
                            wanted was were)
            verb-pr (are be create creates get (get out of) is jump sweep want wants)))
(defun do-one (sen)
  (remove nil
          (loop for wt in *word-types* appending
                (loop for w in (getf *words* wt) collecting
                      (if (symbolp w)
                          (when (eq w (car sen))
                            (list (list wt w) (cdr sen)))
                        (when (and (>= (length sen) (length w))
           (equal w (subseq sen 0 (length w))))
        (list (list wt w) (subseq sen (length w)))))))))
(defun do-one-2 (sen)
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
  (let ((l (do-one (mapcar (lambda (x) (intern (format nil "~a" x))) sen))) (r nil))
    (loop while l do
    (let ((s (pop l)))
      (if (cadr s)
    (let ((pl (do-one (cadr s))))
      (when pl
        (loop for p in pl do
        (push (list (append (if (symbolp (caar s))
              (list (car s))
            (car s))
                (list (car p)))
              (cadr p))
        l))))
        (push (car s) r))))
    r))
(defun tag-sen-2 (sen)
  (let ((l (do-one-2 (mapcar [intern (format nil "~a" _)] sen))) (r nil))
    (loop while l do
    (let ((s (pop l)))
      (if (cadr s)
    (let ((pl (do-one-2 (cadr s))))
      (loop for p in pl do
      (if (listp (car s))
          (push (list (cons (car p) (car s)) (cadr p)) l)
        (push (list (list (car p) (car s)) (cadr p)) l))))
        (push (car s) r))))
    (mapcar #'reverse r)))

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
(defun flat (tree)
  (let ((r (loop for i in (remove nil tree) if (listp i) append (flat i) else collect i)))
    (if (listp r)
  r
      (list r))))
(defmacro match-fn (name type args &optional req) ;arg: (mode type location [flag])
  (flet
   ((do1 (? _)
   `(setf r
    (flat
     (mapcar [if (eq (caar (remsen _)) ',(cadr _))
           (let ((s (pop (remsen _))))
             (push (cadr s) (,(caddr _) _))
             ,(when (cadddr _)
          `(push ',(cadddr _) (,(caddr _) _)))
             _)
         ,(if ? '_ nil)]
       r))))
    (do$ (? _)
   `(setf r
    (flat
     (loop for x in r appending
           (let ((s (cons x
              (loop for y in (flat (,(cadr _) (remsen x)))
              collecting
              (let ((c (copy-node x)) (n nil))
                (rotatef (remsen c) (remsen y) n)
                (push y (,(caddr _) c))
                ,(when (cadddr _)
             `(push ',(cadddr _) (,(caddr _) c)))
                c)))))
       ,(unless ? '(pop s))
       s))))))
   `(defun ,name (sen)
      (when (and sen
     ,(if req
          (if (symbolp req)
        `(member ',req sen :key #'car)
      `(loop for s in ',req always (member s sen :key #'car)))
        t))
  ;(format t "(~a ~a)~%" ',name sen)
  (let ((r (list (make-node ',type sen))))
    ,@(mapcar [ccase (car _)
         (1 (do1 nil _))
         ($ (do$ nil _))
         (1? (do1 t _))
         ($? (do$ t _))
         (1* `(setf r
              (flat
               (loop for x in r collecting
               (let ((y (copy-node x)))
                 (loop while (and (remsen y)
                (eq (caar (remsen y)) ',(cadr _)))
                 do (push (cadr (pop (remsen y))) (,(caddr _) y)))
                 y)))))
         ($* `(setf r
              (flat
               (loop for x in (flat r) appending
               (cons x
               (let ((d nil)
               (g (loop for n in (flat (,(cadr _) (remsen x))) collecting
                  (let ((n2 (copy-node x)))
                    (setf (remsen n2) (remsen n))
                    (setf (remsen n) nil)
                    (push n (,(caddr _) n2))
                    n2))))
                 (loop while g do
                 (let* ((h (pop g)) (a (flat (,(cadr _) (remsen h)))))
                   (if a
                 (dolist (b a)
                   (let ((i (copy-node h)))
                     (setf (remsen i) (remsen b))
                     (setf (remsen b) nil)
                     (push b (,(caddr _) i))
                     (push i g)))
                     (push h d))))
                 d))))))
         (! `(loop for x in r do
             (progn
               (push ',(cadr _) (flags x))
               ,(when (cadddr _)
            `(push ',(cadddr _) (flags x))))))]
        args)
    (flat r))))))
(defmacro match-fn-2 (name args req)
  (let ((gl nil) (bl nil))
    (labels ((n (type where &optional flag) ;;;;;;;;USE CCASE!
    (let ((g (if (eq where 'is) where (gensym))))
      `((setf sen
        (let ((snl nil))
          (loop for i in sen do
          (let ((sn (pop i)))
            (when (eq (type (car sn)) ',type)
              (push (list (pop sn) ',flag) i)
              (push ',g i)
              (push sn i)
              (push i snl))))
          snl))
        ,(if (eq where 'is)
       nil
           `(progn
        (push (getf sn ',g) (,where is))
        ,(when flag
           `(push ',flag (,where is)))))))))
      (dolist (i args)
        (let ();(r (apply (function (car i)) (cdr i))))
    (push (car r) gl)
    (push (cadr r) bl))))
    `(defun ,name (s)
       (when (or (not ',req) (loop for i in ',req always (member i sen :key #'type)))
   (let ((sen (list (mapcar #'copynode s) nil)))
     ,@(reverse gl)
     (setf sen (loop for sn in sen collecting (let ((is (getf sn 'is))) ,@bl is)))
     sen)))))

(defvar *pats* '())
(defmacro rules (args)
  `(progn ,@(mapcar [progn (push (car _) *pats*) (cons 'match-fn _)] args)))
(defmacro defor (name fns)
  ;(push name *pats*)
  `(defun ,name (sen)
     (remove nil (loop for f in ',fns collecting (funcall f sen)))))

(rules
 (($adj adj ((1? adv descs) (1 adj is)) adj)
  ($con-1sen con (($ $--con-1sen before) (1 con is) ($ $--con-1sen after)) con)
  ($con+sen con (($* $verb before) (1 con+ is) ($ $verb after)) con+)
  ($con+sen1 con (($ $verb before) (1 con+ is) ($ $verb after)) con+)
  ($conobj con (($* $obj before) (1 con+ is) ($ $obj after)) con+)
  ($dep dep ((1 dep is) ($ $verb other)) dep)
  ($imp imp ((1 verb-imp is) ($ $verb other)) verb-imp)
  ($inf verb ((1 verb-inf is) ($? $obj other :object) (! inf flags :tense)) verb-inf)
  ($ing verb ((1 ing is) ($? $obj other :object) (! ing flags :tense)) ing)
  ($ns noun ((1? art flags :article) ($* $adj descs) (1 noun-1 is) ($? $prep descs)) noun-1)
  ($np noun ((1? art flags :article) ($* $adj descs) (1 noun+ is) ($? $prep descs)) noun+)
  ($prepp noun ((1 prep flags :prep) (1? art flags :article) ($* $adj descs) (1 noun+ is) ($? $prep descs)) (prep noun+))
  ($preps noun ((1 prep flags :prep) (1? art flags :article) ($* $adj descs) (1 noun-1 is) ($? $prep descs)) (prep noun-1))
  ($pro noun ((1 pro is) (! t flags :pronoun)) pro)
  ($quot quot ((1 punc is) ($ $sen other) (1 punc is)) punc)
  ($socon con (($* $subobject before) (1 con+ is) ($ $subobject after)) con+)
  ($subobject col (($ $object other :subject2) ($ $object other :object)))
  ($term term ((1 punc is) ($ $noun other) (1 punc is)) punc)
  ($verbp verb (($? $prep descs) ($ $object other :subject) (1 verb-pa is) ($? $object other :object) (! past flags :tense)) verb-pa)
  ($verbp2s verb (($? $prep descs) ($ $object other :subject) (1 verb-pa is) ($ $doublesubj other :object) (! past flags :tense) (! 2 flags :subjects)) verb-pa)
  ($verbpd verb ((1? loc flags :loc) ($ $object other :subject) (1 verb-pa is) ($? $object other :object) (! past flags :tense)) verb-pa)
  ($verbpr verb (($? $prep descs) ($ $object other :subject) (1 verb-pr is) ($? $object other :object) (! present flags :tense)) verb-pr)
  ($verbprd verb ((1? loc flags :loc) ($ $object other :subject) (1 verb-pr is) ($? $object other :object) (! present flags :tense)) verb-pr)
  ))
(defor $--con-1sen ($verb $con+sen $con+sen1))
(defor $doublesubj ($subobject $socon))
(defor $noun ($ns $np))
(defor $obj ($noun $prep $adj $ing $inf $quot $pro $dep $term))
(defor $object ($obj $conobj))
(defor $prep ($preps $prepp))
(defor $sen ($verb $imp $con+sen $con-1sen $con+sen1))
(defor $verb ($verbp $verbpd $verbpr $verbprd))

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

(defun o= (a b)
  (string= (format nil "~a" a) (format nil "~a" b)))
(defun output (sen &key norem)
  (format t "==========~%~{~a~%~%~}"
    (let ((l (let ((s (flat (loop for s in (tag-sen sen) appending
          (loop for f in *pats* collecting (progn
                     ;(format t "~a~%" f)
                     (funcall f s)))))))
         (if (listp s)
       (remove-duplicates s :test #'o=)
           (list s)))))
      (if norem
    (remove-if #'remsen l)
        l))))

(output '(In the beginning God created the heavens and the earth) :norem t)
(output '(Now the earth was without shape and empty and darkness was over the surface of the watery deep but the Spirit of God was moving over the surface of the water) :norem t)
;(output '(God said |"| Let there be light |"| And there was light) :norem t)
;(output '(God saw that the light was good so God separated the light from the darkness) :norem t)
;(output '(God called the light |"| day |"| and the darkness |"| night |"|) :norem t)
