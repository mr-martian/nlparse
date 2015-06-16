(defun to-graph (lst file)
  (with-open-file
   (out file :direction :output :if-exists :supersede)
   (format out "digraph {~%")
   (labels ((donode (l)
		    (let ((g (gensym)))
		      (if (symbolp l)
			  (progn
			    (format out
				    "  ~a [label=\"~a\",style=\"filled\",labelfontcolor=\"red\",labelfontsize=\"20\",fontname=\"Times-Roman\"];~%"
				    g l)
			    g)
			(if (symbolp (car l))
			    (let ((s (donode (car l))))
			      (format out "  ~a -> {~{~a ~}};~%" s
				      (mapcar #'donode (cdr l)))
			      s)
			  (progn
			    (format out "  ~a [label=\"\"]~%  ~a -> {~{~a ~}};~%"
				    g g (mapcar #'donode l))
			    g))))))
	   (donode lst))
   (format out "}")))
