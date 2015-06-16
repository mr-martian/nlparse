(defvar *props* nil)
(defvar *abstract* nil)
(defvar *objects* nil)
(defvar *actions* nil)

(defmacro make-find (name lst char)
  (let ((g (gensym)))
    `(block nil
	    (defun ,name (,g)
	      (or (find ,g ,lst) (car (push ,g ,lst))))
	    (set-macro-character ,char
				 #'(lambda (stream char)
				     (list ',name (list 'quote (read stream t nil t))))))))
(make-find -prop *props* #\$)
(make-find abstract *abstract* #\%)
(make-find object *objects* #\^)
(make-find action *actions* #\~)
(defun prop (obj prop &optional val)
  (if val
      (setf (get obj prop) val)
    (get obj prop)))
(defun act (verb subject &optional object)
  (prop verb $subject subject)
  (when object
    (prop verb $object object)))
