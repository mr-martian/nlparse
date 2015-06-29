typ = 'prep'
flags = ''
lst = 'above from in of on out over to under up without'.split()
f = open('words.txt', 'a')
for i in lst:
    f.write("""({parsenode ((type . %s)
	     (is %s)
	     (flags%s)
	     (descs)
	     (other)
	     (remsen))})\n""" % (typ, i, flags))
f.close()
