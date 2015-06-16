(adj     a (flags) (descs))
(adv     a (flags) (descs))
(prep    p (flags) (descs) thing)
(pronoun p (flags) (descs))
(noun    n (flags) (descs))
(verb    v (flags) (descs) &key subject object)
(con     c (flags) (descs) (parts))

"The train left an hour ago."
(verb "leave"
      ((:tense . :past))
      ((adv "ago"
	    ()
	    ((noun "hour"
		   ((:article . :a))
		   ()))))
      :subject (noun "train"
		     ((:number . 1)
		      (:article . :the))
		     ()))

"Socks that eat people are never permitted at this table."
(verb "is"
      ((:tense . :present))
      ((adv "never"
	    ()
	    ()))
      :subject (noun "sock"
		     ((:number . :not1))
		     ((verb "eat"
			    ((:clause . :that))
			    ()
			    :subject (pronoun "they"
					      ((:hidden t)))
			    :object (noun "person"
					  ((:number . :not1))
					  ()))))
      :object (adj "permitted"
		   ()
		   (prep "at"
			 ()
			 (noun "table"
			       ((:number . 1))
			       ((adj "this"
				     ()
				     ()))))))

"What is this?"
(verb "is"
      ((:tense . :present)
       (:mode . :q?))
      ()
      :subject (pronoun "this"
			((:number . 1)))
      :object (pronoun "what"
		       ()))

"All this happened long ago."
(verb "happen"
      ((:tense . :past))
      ((adv "ago"
	    ()
	    ((adj "long"
		  ()
		  ()))))
      :subject (pronoun "this"
			()
			((adj "all"
			      ()
			      ()))))

"Linear Algebra is a text for a first US undergraduate Linear Algebra course. It is Free. You can use it as a main text, as a supplement, or for independent study."
"http://joshua.smcvt.edu/linearalgebra/"
(verb "is"
      ((:tense . :present))
      ()
      :subject (noun "Linear Algebra"
		     ((:name . t))
		     ())
      :object (noun "text"
		    ((:number . 1)
		     (:article . :a))
		    ((prep "for"
			   ()
			   ()
			   (noun "course"
				 ((:article . :a)
				  (:count . 1))
				 ((adj "first"
				       ()
				       ())
				  (noun "US"
					((:name . t))
					())
				  (adj "undergraduate"
				       ()
				       ())
				  (noun "Linear Algebra"
					((:name . t))
					())))))))
(verb "is"
      ((:tense . :present))
      ()
      :subject (pronoun "it"
			()
			())
      :object (adj "free"
		   ()
		   ()))
(verb "can"
      ((:tense . :present))
      ()
      :subject (pronoun "you"
			()
			())
      :object (verb "use"
		    ((:tense . :inf))
		    ((con "or"
			  ()
			  ()
			  ((prep "as"
				 ()
				 (noun "text"
				       ((:article . :a)
					(:number . 1))
				       ((adj "main"
					     ()
					     ()))))
			   (prep "as"
				 ()
				 (noun "supplement"
				       ((:article . :a)
					(:number . 1))
				       ()))
			   (prep "for"
				 ()
				 (noun "study"
				       ()
				       ((adj "independent"
					     ()
					     ())))))))
		    :object (pronoun "it"
				     ()
				     ())))

"El es una llama que se llama llama."
(verb "ser"
      ((:tense . :present))
      ()
      :subject (pronoun "el"
			()
			())
      :object (noun "llama"
		    ((:article . :a)
		     (:altdef . 0)
		     (:count . 1))
		    ((verb "se llama"
			   ((:tense . :present)
			    (:clause . :que))
			   ()
			   :subject (pronoun "el"
					     ((:hidden . t))
					     ())
			   :object (noun "llama"
					 ((:altdef . 1))
					 ())))))

"Grey and Brady are jet lagged and exhausted from their week in Alabama. Listen as they struggle through a conversation about: humblebrags and bragging humble (it will never end), the original iPhone keynote, their travel experiences, instructions in security, everybody loves Brady, US vs Irish passports, Indian bureaucracy, guns guns guns, Alabama food, Random Acts of Intelligence, The U.S. Space and Rocket Center, and a little bit on fame."
(verb "is"
      ((:tense . :present))
      ()
      :subject (con "and"
		    ()
		    ()
		    ((noun "Grey"
			   ((:name . t)
			    (:count . 1))
			   ())
		     (noun "Brady"
			   ((:name . t)
			    (:count . 1))
			   ())))
      :object (con "and"
		   ()
		   ()
		   ((adj "jet lagged"
			 ()
			 ())
		    (adj "exhausted"
			 ()
			 ((prep "from"
				()
				(noun "week"
				      ()
				      ((adj "their"
					    ()
					    ())
				       (prep "in"
					     ()
					     (noun "Alabama"
						   ((:name . t)
						    (:count . 1))
						   ()))))))))))
(verb "listen"
      ((:mode . :do!))
      ((adv "as"
	    ()
	    ((verb "struggle"
		   ()
		   ((prep "through"
			  ()
			  (noun "conversation"
				((:number . 1)
				 (:article . :a))
				((prep "about"
				       ()
				       (con "and"
					    ()
					    ()
					    ((con "and"
						  ()
						  ((verb "end"
							 ((:tense . :future)
							  (:mode . :is.)
							  (:parenthetical . t))
							 ((adv "never"
							       ()
							       ()))
							 :subject (pronoun "it"
									   ()
									   ())))
						  ((noun "humblebrag"
							 ((:number . :not1))
							 ())
						   (adj "braging humble"
							()
							())))
					     (noun "keynote"
						   ((:article . :the))
						   ((adj "original"
							 ()
							 ())
						    (noun "iPhone"
							  ()
							  ())))
					     (noun "experience"
						   ((:number . :not1))
						   ((adj "their"
							 ()
							 ())
						    (noun "travel"
							  ()
							  ())))
					     (noun "instruction"
						   ((:number . :not1))
						   ((prep "in"
							  ()
							  ()
							  (noun "security"
								()
								()))))
					     (verb "love"
						   ((:mode . :is.)
						    (:tense . :present))
						   ()
						   (noun "everybody"
							 ()
							 ())
						   (noun "Brady"
							 ((:number . 1)
							  (:name . t))
							 ()))
					     (noun "passport"
						   ((:number . :not1))
						   ((con "vs"
							 ()
							 ()
							 ((adj "US"
							       ()
							       ())
							  (adj "Irish"
							       ()
							       ())))))
					     (noun "bureaucracy"
						   ()
						   ((adj "Indian"
							 ()
							 ())))
					     (con "and"
						  ((:hidden . t))
						  ()
						  ((noun "gun"
							 ((:number . 1))
							 ())
						   (noun "gun"
							 ((:number . 1))
							 ())
						   (noun "gun"
							 ((:number . 1))
							 ())))
					     (noun "food"
						   ()
						   ((noun "Alabama"
							  ((:name . t))
							  ())))
					     (noun "act"
						   ((:number . :not1))
						   ((adj "random"
							 ()
							 ())
						    (prep "of"
							  ()
							  ()
							  (noun "intelligence"
								()
								()))))
					     (noun "center"
						   ((:article . :the))
						   ((noun "U.S."
							  ((:name . t))
							  ())
						    (con "and"
							 ()
							 ()
							 ((noun "space"
								()
								())
							  (noun "rocket"
								()
								())))))
					     (noun "bit"
						   ((:article . :a))
						   ((adj "little"
							 ()
							 ())
						    (prep "on"
							  ()
							  ()
							  (noun "fame"
								()
								()))))))))))))
		   :subject (pronoun "they"
				     ((:hidden . nil))
				     ())))))
